using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Payments;
using Worka.Services.Enums;

namespace Worka.Services.Payments
{
    public class PaymentsService : IPaymentsService
    {
        private const string PendingCheckoutStatus = "pending_checkout";
        private const string PaidStatus = "paid";

        private readonly WorkaDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly string _stripeSecretKey;
        private readonly string _webhookSecret;
        private readonly decimal _serviceFeePercent;
        private readonly decimal _serviceFeeMinimum;
        private readonly string _currency;
        private readonly string _defaultCountry;

        public PaymentsService(WorkaDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _stripeSecretKey = configuration["Stripe:SecretKey"] ?? configuration["Stripe__SecretKey"] ?? string.Empty;
            _webhookSecret = configuration["Stripe:WebhookSecret"] ?? configuration["Stripe__WebhookSecret"] ?? string.Empty;
            _currency = (configuration["Stripe:Currency"] ?? configuration["Stripe__Currency"] ?? "gbp").ToLowerInvariant();
            _defaultCountry = (configuration["Stripe:DefaultCountry"] ?? configuration["Stripe__DefaultCountry"] ?? "GB").ToUpperInvariant();

            _serviceFeePercent = GetDecimalSetting("Worka:ServiceFeePercent", "Worka__ServiceFeePercent", 10m);
            _serviceFeeMinimum = GetDecimalSetting("Worka:ServiceFeeMinimum", "Worka__ServiceFeeMinimum", 2m);

            if (!string.IsNullOrWhiteSpace(_stripeSecretKey))
            {
                StripeConfiguration.ApiKey = _stripeSecretKey;
            }
        }

        public async Task<WorkaResponse<StripeConnectStatusDTO>> GetProfessionalStripeStatusAsync(string userId)
        {
            var professionalResponse = await GetProfessionalForUserAsync(userId);
            if (!professionalResponse.Success)
            {
                return new WorkaResponse<StripeConnectStatusDTO>(professionalResponse.Message);
            }

            var professional = professionalResponse.Data;
            if (string.IsNullOrWhiteSpace(professional.StripeAccountId))
            {
                return new WorkaResponse<StripeConnectStatusDTO>(ToConnectStatus(professional));
            }

            try
            {
                var account = await new AccountService().GetAsync(professional.StripeAccountId);
                professional.StripeChargesEnabled = account.ChargesEnabled;
                professional.StripePayoutsEnabled = account.PayoutsEnabled;
                professional.StripeDetailsSubmitted = account.DetailsSubmitted;
                professional.UpdatedAt = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync();
            }
            catch (StripeException)
            {
                // Keep the last known local state if Stripe is temporarily unavailable.
            }

            return new WorkaResponse<StripeConnectStatusDTO>(ToConnectStatus(professional));
        }

        public async Task<WorkaResponse<StripeConnectOnboardingResponseDTO>> CreateProfessionalOnboardingLinkAsync(
            string userId,
            string returnUrl,
            string refreshUrl)
        {
            if (!IsStripeConfigured())
            {
                return new WorkaResponse<StripeConnectOnboardingResponseDTO>("Stripe is not configured.");
            }

            if (!IsSafeRedirectUrl(returnUrl) || !IsSafeRedirectUrl(refreshUrl))
            {
                return new WorkaResponse<StripeConnectOnboardingResponseDTO>("Valid return and refresh URLs are required.");
            }

            var professionalResponse = await GetProfessionalForUserAsync(userId);
            if (!professionalResponse.Success)
            {
                return new WorkaResponse<StripeConnectOnboardingResponseDTO>(professionalResponse.Message);
            }

            var professional = professionalResponse.Data;
            if (string.IsNullOrWhiteSpace(professional.StripeAccountId))
            {
                var accountOptions = new AccountCreateOptions
                {
                    Type = "express",
                    Country = _defaultCountry,
                    Email = professional.Email,
                    BusinessType = "individual",
                    Metadata = new Dictionary<string, string>
                    {
                        ["workaProfessionalId"] = professional.ProfessionalId.ToString(),
                        ["workaUserId"] = professional.UserId.ToString()
                    }
                };

                accountOptions.AddExtraParam("capabilities[transfers][requested]", true);
                accountOptions.AddExtraParam("capabilities[card_payments][requested]", true);

                var account = await new AccountService().CreateAsync(accountOptions);
                professional.StripeAccountId = account.Id;
                professional.StripeChargesEnabled = account.ChargesEnabled;
                professional.StripePayoutsEnabled = account.PayoutsEnabled;
                professional.StripeDetailsSubmitted = account.DetailsSubmitted;
                professional.UpdatedAt = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            var accountLink = await new AccountLinkService().CreateAsync(new AccountLinkCreateOptions
            {
                Account = professional.StripeAccountId,
                RefreshUrl = refreshUrl,
                ReturnUrl = returnUrl,
                Type = "account_onboarding"
            });

            return new WorkaResponse<StripeConnectOnboardingResponseDTO>(
                new StripeConnectOnboardingResponseDTO
                {
                    StripeAccountId = professional.StripeAccountId,
                    Url = accountLink.Url
                });
        }

        public async Task<WorkaResponse<PaymentCheckoutResponseDTO>> CreateQuoteCheckoutAsync(
            string customerUserId,
            string jobId,
            string quoteId,
            string successUrl,
            string cancelUrl)
        {
            if (!IsStripeConfigured())
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Stripe is not configured.");
            }

            if (!IsSafeRedirectUrl(successUrl) || !IsSafeRedirectUrl(cancelUrl))
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Valid success and cancel URLs are required.");
            }

            if (!Guid.TryParse(customerUserId, out var customerUserGuid)
                || !Guid.TryParse(jobId, out var jobGuid)
                || !Guid.TryParse(quoteId, out var quoteGuid))
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Invalid payment request.");
            }

            var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == customerUserGuid);
            if (customer == null)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Customer profile not found.");
            }

            var job = await _dbContext.Jobs.FirstOrDefaultAsync(j => j.JobId == jobGuid && j.CustomerId == customer.CustomerId);
            if (job == null)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Job not found.");
            }

            if (job.AcceptedQuoteId.HasValue)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("This job is already booked.");
            }

            var quote = await _dbContext.Quotes.FirstOrDefaultAsync(q => q.QuoteId == quoteGuid && q.JobId == job.JobId);
            if (quote == null)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Quote not found.");
            }

            var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.ProfessionalId == quote.ProfessionalId);
            if (professional == null)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("Professional profile not found.");
            }

            var statusResponse = await GetProfessionalStripeStatusAsync(professional.UserId.ToString());
            if (!statusResponse.Success || !statusResponse.Data.ReadyForPayments)
            {
                return new WorkaResponse<PaymentCheckoutResponseDTO>("The worker needs to finish payout setup before this quote can be paid.");
            }

            var quoteAmount = RoundMoney(quote.Price);
            var serviceFee = CalculateServiceFee(quoteAmount);
            var total = quoteAmount + serviceFee;

            var payment = new WorkaPayment
            {
                JobId = job.JobId,
                QuoteId = quote.QuoteId,
                CustomerId = customer.CustomerId,
                ProfessionalId = professional.ProfessionalId,
                StripeConnectedAccountId = professional.StripeAccountId,
                QuoteAmount = quoteAmount,
                ServiceFeeAmount = serviceFee,
                WorkerAmount = quoteAmount,
                TotalAmount = total,
                Currency = _currency,
                Status = PendingCheckoutStatus,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var session = await new SessionService().CreateAsync(new SessionCreateOptions
            {
                Mode = "payment",
                SuccessUrl = AppendCheckoutSession(successUrl),
                CancelUrl = cancelUrl,
                ClientReferenceId = payment.PaymentId.ToString(),
                CustomerEmail = customer.Email,
                LineItems = new List<SessionLineItemOptions>
                {
                    new()
                    {
                        Quantity = 1,
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = _currency,
                            UnitAmount = ToMinorUnits(total),
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"Worka booking: {job.Name}",
                                Description = $"Quote {FormatAmount(quoteAmount)} + Worka service fee {FormatAmount(serviceFee)}"
                            }
                        }
                    }
                },
                PaymentIntentData = new SessionPaymentIntentDataOptions
                {
                    ApplicationFeeAmount = ToMinorUnits(serviceFee),
                    TransferData = new SessionPaymentIntentDataTransferDataOptions
                    {
                        Destination = professional.StripeAccountId
                    },
                    Metadata = PaymentMetadata(payment)
                },
                Metadata = PaymentMetadata(payment)
            });

            payment.StripeCheckoutSessionId = session.Id;
            _dbContext.WorkaPayments.Add(payment);
            await _dbContext.SaveChangesAsync();

            return new WorkaResponse<PaymentCheckoutResponseDTO>(
                new PaymentCheckoutResponseDTO
                {
                    PaymentId = payment.PaymentId.ToString(),
                    CheckoutSessionId = session.Id,
                    CheckoutUrl = session.Url,
                    QuoteAmount = payment.QuoteAmount,
                    ServiceFeeAmount = payment.ServiceFeeAmount,
                    WorkerAmount = payment.WorkerAmount,
                    TotalAmount = payment.TotalAmount,
                    Currency = payment.Currency
                });
        }

        public async Task<WorkaResponse<PaymentResponseDTO>> HandleStripeWebhookAsync(string payload, string signature)
        {
            if (string.IsNullOrWhiteSpace(_webhookSecret))
            {
                return new WorkaResponse<PaymentResponseDTO>("Stripe webhook secret is not configured.");
            }

            Stripe.Event stripeEvent;
            try
            {
                stripeEvent = EventUtility.ConstructEvent(payload, signature, _webhookSecret);
            }
            catch (StripeException ex)
            {
                return new WorkaResponse<PaymentResponseDTO>("Invalid Stripe webhook.", ex.Message);
            }

            if (stripeEvent.Type != "checkout.session.completed")
            {
                return new WorkaResponse<PaymentResponseDTO>(
                    new PaymentResponseDTO(new WorkaPayment { Status = "ignored" }),
                    message: "Event ignored.");
            }

            if (stripeEvent.Data.Object is not Session session)
            {
                return new WorkaResponse<PaymentResponseDTO>("Unexpected Stripe session payload.");
            }

            if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            {
                return new WorkaResponse<PaymentResponseDTO>("Checkout session is not paid.");
            }

            var payment = await _dbContext.WorkaPayments
                .FirstOrDefaultAsync(p => p.StripeCheckoutSessionId == session.Id);

            if (payment == null)
            {
                return new WorkaResponse<PaymentResponseDTO>("Payment record not found.");
            }

            if (payment.Status == PaidStatus)
            {
                return new WorkaResponse<PaymentResponseDTO>(new PaymentResponseDTO(payment));
            }

            var job = await _dbContext.Jobs.FirstOrDefaultAsync(j => j.JobId == payment.JobId);
            if (job == null)
            {
                return new WorkaResponse<PaymentResponseDTO>("Job not found.");
            }

            job.AcceptedQuoteId = payment.QuoteId;
            job.Status = JobStatusEnum.Accepted;
            job.UpdatedAt = DateTimeOffset.UtcNow;

            payment.Status = PaidStatus;
            payment.StripePaymentIntentId = session.PaymentIntentId ?? string.Empty;
            payment.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();

            return new WorkaResponse<PaymentResponseDTO>(new PaymentResponseDTO(payment));
        }

        private async Task<WorkaResponse<Professional>> GetProfessionalForUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<Professional>("Invalid user ID format.");
            }

            var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);
            return professional == null
                ? new WorkaResponse<Professional>("Professional profile not found.")
                : new WorkaResponse<Professional>(professional);
        }

        private StripeConnectStatusDTO ToConnectStatus(Professional professional)
        {
            return new StripeConnectStatusDTO
            {
                Connected = !string.IsNullOrWhiteSpace(professional.StripeAccountId),
                StripeAccountId = professional.StripeAccountId,
                ChargesEnabled = professional.StripeChargesEnabled,
                PayoutsEnabled = professional.StripePayoutsEnabled,
                DetailsSubmitted = professional.StripeDetailsSubmitted
            };
        }

        private bool IsStripeConfigured()
        {
            return !string.IsNullOrWhiteSpace(_stripeSecretKey);
        }

        private decimal CalculateServiceFee(decimal quoteAmount)
        {
            return RoundMoney(Math.Max(_serviceFeeMinimum, quoteAmount * (_serviceFeePercent / 100m)));
        }

        private static decimal RoundMoney(decimal amount)
        {
            return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        }

        private static long ToMinorUnits(decimal amount)
        {
            return decimal.ToInt64(RoundMoney(amount) * 100m);
        }

        private string FormatAmount(decimal amount)
        {
            return $"{_currency.ToUpperInvariant()} {amount:0.00}";
        }

        private decimal GetDecimalSetting(string sectionKey, string flatKey, decimal fallback)
        {
            var value = _configuration[sectionKey] ?? _configuration[flatKey];
            return decimal.TryParse(value, out var parsed) ? parsed : fallback;
        }

        private static bool IsSafeRedirectUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }

        private static string AppendCheckoutSession(string successUrl)
        {
            var separator = successUrl.Contains('?') ? "&" : "?";
            return $"{successUrl}{separator}session_id={{CHECKOUT_SESSION_ID}}";
        }

        private static Dictionary<string, string> PaymentMetadata(WorkaPayment payment)
        {
            return new Dictionary<string, string>
            {
                ["workaPaymentId"] = payment.PaymentId.ToString(),
                ["workaJobId"] = payment.JobId.ToString(),
                ["workaQuoteId"] = payment.QuoteId.ToString(),
                ["workaProfessionalId"] = payment.ProfessionalId.ToString(),
                ["workaCustomerId"] = payment.CustomerId.ToString()
            };
        }
    }
}
