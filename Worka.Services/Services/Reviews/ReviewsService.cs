using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Reviews;
using Worka.Services.Enums;
using Worka.Services.Notifications;

namespace Worka.Services.Reviews
{
    public class ReviewsService : IReviewsService
    {
        private readonly WorkaDbContext _dbContext;
        private readonly INotificationsService _notifications;

        public ReviewsService(WorkaDbContext dbContext, INotificationsService notifications = null)
        {
            _dbContext = dbContext;
            _notifications = notifications;
        }

        public async Task<WorkaResponse<ReviewResponseDTO>> CreateReviewAsync(
            string userId, string jobId, CreateReviewDTO review)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<ReviewResponseDTO>("Invalid user identity.");
                }

                if (!Guid.TryParse(jobId, out var jobGuid))
                {
                    return new WorkaResponse<ReviewResponseDTO>("Invalid job ID format.");
                }

                if (review.Rating < 1 || review.Rating > 5)
                {
                    return new WorkaResponse<ReviewResponseDTO>("Rating must be between 1 and 5 stars.");
                }

                var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<ReviewResponseDTO>("Customer profile not found.");
                }

                var job = await _dbContext.Jobs
                    .FirstOrDefaultAsync(j => j.JobId == jobGuid && j.CustomerId == customer.CustomerId);
                if (job == null)
                {
                    return new WorkaResponse<ReviewResponseDTO>("Job not found.");
                }

                if (job.Status != JobStatusEnum.Completed)
                {
                    return new WorkaResponse<ReviewResponseDTO>(
                        "You can review a professional once the job is marked complete.");
                }

                if (job.AcceptedQuoteId == null)
                {
                    return new WorkaResponse<ReviewResponseDTO>("This job has no booked professional to review.");
                }

                var alreadyReviewed = await _dbContext.Reviews.AnyAsync(r => r.JobId == jobGuid);
                if (alreadyReviewed)
                {
                    return new WorkaResponse<ReviewResponseDTO>("You have already reviewed this job.");
                }

                var acceptedQuote = await _dbContext.Quotes
                    .FirstOrDefaultAsync(q => q.QuoteId == job.AcceptedQuoteId);
                if (acceptedQuote == null)
                {
                    return new WorkaResponse<ReviewResponseDTO>("The booked quote could not be found.");
                }

                var entity = new Review
                {
                    JobId = job.JobId,
                    CustomerId = customer.CustomerId,
                    ProfessionalId = acceptedQuote.ProfessionalId,
                    Rating = review.Rating,
                    Comment = (review.Comment ?? string.Empty).Trim(),
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _dbContext.Reviews.Add(entity);
                await _dbContext.SaveChangesAsync();

                // Let the reviewed professional know.
                var reviewedPro = await _dbContext.Professionals
                    .FirstOrDefaultAsync(p => p.ProfessionalId == acceptedQuote.ProfessionalId);
                if (reviewedPro != null && _notifications != null)
                {
                    await _notifications.NotifyAsync(
                        reviewedPro.UserId,
                        "review",
                        $"You received a {entity.Rating}★ review",
                        $"{customer.FirstName} reviewed your work on \"{job.Name}\".",
                        job.JobId);
                }

                return new WorkaResponse<ReviewResponseDTO>(
                    new ReviewResponseDTO(entity, customer.FirstName, job.Name));
            }
            catch (Exception ex)
            {
                return WorkaResponse<ReviewResponseDTO>.Fail(ex, "An error occurred while saving the review.");
            }
        }

        public async Task<WorkaResponse<List<ReviewResponseDTO>>> GetForProfessionalAsync(string professionalId)
        {
            try
            {
                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return new WorkaResponse<List<ReviewResponseDTO>>("Invalid professional ID format.");
                }

                var reviews = await _dbContext.Reviews
                    .Where(r => r.ProfessionalId == professionalGuid)
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(100)
                    .ToListAsync();

                var customerIds = reviews.Select(r => r.CustomerId).Distinct().ToList();
                var jobIds = reviews.Select(r => r.JobId).Distinct().ToList();

                var customerNames = await _dbContext.Customers
                    .Where(c => customerIds.Contains(c.CustomerId))
                    .ToDictionaryAsync(c => c.CustomerId, c => c.FirstName);
                var jobNames = await _dbContext.Jobs
                    .Where(j => jobIds.Contains(j.JobId))
                    .ToDictionaryAsync(j => j.JobId, j => j.Name);

                var items = reviews
                    .Select(r => new ReviewResponseDTO(
                        r,
                        customerNames.TryGetValue(r.CustomerId, out var name) ? name : "A customer",
                        jobNames.TryGetValue(r.JobId, out var jobName) ? jobName : "a job"))
                    .ToList();

                return new WorkaResponse<List<ReviewResponseDTO>>(items);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<ReviewResponseDTO>>.Fail(ex, "An error occurred while loading reviews.");
            }
        }
    }
}
