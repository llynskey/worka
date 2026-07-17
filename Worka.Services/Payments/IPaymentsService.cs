using Worka.Services.Common;
using Worka.Services.DTOs.Payments;

namespace Worka.Services.Payments
{
    public interface IPaymentsService
    {
        Task<WorkaResponse<StripeConnectStatusDTO>> GetProfessionalStripeStatusAsync(string userId);

        Task<WorkaResponse<StripeConnectOnboardingResponseDTO>> CreateProfessionalOnboardingLinkAsync(
            string userId,
            string returnUrl,
            string refreshUrl);

        Task<WorkaResponse<PaymentCheckoutResponseDTO>> CreateQuoteCheckoutAsync(
            string customerUserId,
            string jobId,
            string quoteId,
            string successUrl,
            string cancelUrl);

        Task<WorkaResponse<PaymentResponseDTO>> HandleStripeWebhookAsync(string payload, string signature);

        Task<WorkaResponse<EarningsSummaryDTO>> GetEarningsForProfessionalAsync(string userId);

        Task<WorkaResponse<CustomerSpendSummaryDTO>> GetPaymentHistoryForCustomerAsync(string userId);
    }
}
