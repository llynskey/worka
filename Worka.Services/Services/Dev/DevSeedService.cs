using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.Enums;

namespace Worka.Services.Dev
{
    public class DevSeedService : IDevSeedService
    {
        private readonly WorkaDbContext _dbContext;

        public DevSeedService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<string>> SeedForUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<string>("Invalid user identity.");
                }

                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
                if (user == null)
                {
                    return new WorkaResponse<string>("User not found.");
                }

                // Ensure the current user has both a customer and a professional
                // profile so a single account can see receipts (customer side) and
                // earnings (professional side) from the seeded bookings.
                var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    customer = new Customer
                    {
                        UserId = userGuid,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email,
                        Phone = string.Empty,
                        Address = string.Empty,
                        Languages = "en",
                        PhotoUrl = string.Empty,
                        PreferredCurrency = "gbp",
                    };
                    _dbContext.Customers.Add(customer);
                }

                var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);
                if (professional == null)
                {
                    professional = new Professional
                    {
                        UserId = userGuid,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email,
                        Specialty = "General",
                        Bio = "Sample professional profile.",
                        ServiceArea = "Local area",
                        LocationLabel = string.Empty,
                        Languages = "en",
                        PhotoUrl = string.Empty,
                        StripeAccountId = string.Empty,
                        StripeChargesEnabled = true,
                        StripePayoutsEnabled = true,
                        StripeDetailsSubmitted = true,
                    };
                    _dbContext.Professionals.Add(professional);
                }

                await _dbContext.SaveChangesAsync();

                // Clear any previous sample data for this customer (cascades to the
                // sample quotes and payments) so re-seeding is idempotent.
                var priorSample = await _dbContext.Jobs
                    .Where(j => j.CustomerId == customer.CustomerId && j.Name.StartsWith("[Sample]"))
                    .ToListAsync();
                if (priorSample.Count > 0)
                {
                    _dbContext.Jobs.RemoveRange(priorSample);
                    await _dbContext.SaveChangesAsync();
                }

                var now = DateTimeOffset.UtcNow;

                Job NewJob(string name, string desc, string category, JobStatusEnum status) => new()
                {
                    CustomerId = customer.CustomerId,
                    Name = name,
                    Description = desc,
                    Category = category,
                    Address = "123 Sample Street",
                    LocationLabel = "Sample area",
                    PhotoUrl = string.Empty,
                    Currency = "gbp",
                    Latitude = 51.5074,
                    Longitude = -0.1278,
                    Status = status,
                    CreatedAt = now,
                    UpdatedAt = now,
                };

                Quote NewQuote(Guid jobId, decimal price, string desc, DateTimeOffset when) => new()
                {
                    ProfessionalId = professional.ProfessionalId,
                    JobId = jobId,
                    Price = price,
                    Description = desc,
                    ScheduledAt = when,
                    CreatedAt = now,
                };

                WorkaPayment NewPayment(Guid jobId, Guid quoteId, decimal price)
                {
                    var fee = Math.Max(2m, Math.Round(price * 0.10m, 2));
                    return new WorkaPayment
                    {
                        JobId = jobId,
                        QuoteId = quoteId,
                        CustomerId = customer.CustomerId,
                        ProfessionalId = professional.ProfessionalId,
                        // A seed marker session id; no PaymentIntent → refunds are
                        // simulated in-app (see PaymentsService.CancelBookingAsync).
                        StripeCheckoutSessionId = $"seed_{Guid.NewGuid():N}",
                        StripePaymentIntentId = string.Empty,
                        StripeConnectedAccountId = string.Empty,
                        QuoteAmount = price,
                        ServiceFeeAmount = fee,
                        TotalAmount = price + fee,
                        WorkerAmount = price,
                        Currency = "gbp",
                        Status = "paid",
                        CreatedAt = now,
                        UpdatedAt = now,
                    };
                }

                // A) Open job awaiting quotes (+ one quote with a proposed time).
                var jobA = NewJob("[Sample] Leaky kitchen tap", "Dripping mixer tap — needs a new cartridge or reseat.", "Plumbing", JobStatusEnum.Pending);
                var quoteA = NewQuote(jobA.JobId, 80m, "Replace cartridge and test for leaks.", now.AddDays(2));
                _dbContext.Jobs.Add(jobA);
                _dbContext.Quotes.Add(quoteA);

                // B) Booked + paid job (proposed time, awaiting confirmation).
                var jobB = NewJob("[Sample] Repaint bathroom", "Repaint ceiling and walls with mould-resistant paint.", "Painting", JobStatusEnum.Accepted);
                var quoteB = NewQuote(jobB.JobId, 220m, "Two coats, materials included.", now.AddDays(5));
                jobB.AcceptedQuoteId = quoteB.QuoteId;
                jobB.ScheduledAt = quoteB.ScheduledAt;
                jobB.ScheduleConfirmed = false;
                _dbContext.Jobs.Add(jobB);
                _dbContext.Quotes.Add(quoteB);
                _dbContext.WorkaPayments.Add(NewPayment(jobB.JobId, quoteB.QuoteId, 220m));

                // C) Completed + paid job (confirmed time in the past) — reviewable.
                var jobC = NewJob("[Sample] Fix garden fence", "Two panels blown down in the wind, need refixing.", "Repairs", JobStatusEnum.Completed);
                var quoteC = NewQuote(jobC.JobId, 150m, "Refit panels and replace one post.", now.AddDays(-3));
                jobC.AcceptedQuoteId = quoteC.QuoteId;
                jobC.ScheduledAt = quoteC.ScheduledAt;
                jobC.ScheduleConfirmed = true;
                _dbContext.Jobs.Add(jobC);
                _dbContext.Quotes.Add(quoteC);
                _dbContext.WorkaPayments.Add(NewPayment(jobC.JobId, quoteC.QuoteId, 150m));

                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<string>(
                    "Seeded 3 sample jobs (open, booked, completed) with paid bookings you can cancel/refund and review.");
            }
            catch (Exception ex)
            {
                return WorkaResponse<string>.Fail(ex, "An error occurred while seeding sample data.");
            }
        }
    }
}
