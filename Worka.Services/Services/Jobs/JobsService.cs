using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Jobs;
using Worka.Services.Enums;
using Worka.Services.Notifications;

namespace Worka.Services.Jobs
{
    public class JobsService : IJobsService
    {
        private readonly WorkaDbContext _dbContext;
        private readonly INotificationsService _notifications;

        public JobsService(WorkaDbContext dbContext, INotificationsService notifications = null)
        {
            _dbContext = dbContext;
            _notifications = notifications;
        }


        public async Task<WorkaResponse<JobResponseDTO>> CreateJobAsync(string userId, CreateJobDTO jobDto)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<JobResponseDTO>("Invalid user identity.");
                }

                var customer = await _dbContext.Customers
                    .FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<JobResponseDTO>("Customer profile not found.");
                }

                var address = (jobDto.Address ?? string.Empty).Trim();
                var locationLabel = string.IsNullOrWhiteSpace(jobDto.LocationLabel)
                    ? address
                    : jobDto.LocationLabel.Trim();
                var photoUrl = UploadPaths.SanitizeJobPhoto(jobDto.PhotoUrl);

                if (string.IsNullOrWhiteSpace(jobDto.JobName))
                {
                    return new WorkaResponse<JobResponseDTO>("Give the job a name.");
                }

                if (string.IsNullOrWhiteSpace(address))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a job location.");
                }

                if (!IsValidLatitude(jobDto.Latitude) || !IsValidLongitude(jobDto.Longitude))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a location from the address lookup.");
                }

                var newJob = new Job
                {
                    Name = jobDto.JobName.Trim(),
                    Description = (jobDto.JobDescription ?? string.Empty).Trim(),
                    Category = (jobDto.Category ?? string.Empty).Trim(),
                    Address = address,
                    LocationLabel = locationLabel,
                    PhotoUrl = photoUrl,
                    // Jobs inherit the customer's account-level currency preference.
                    Currency = Currencies.Sanitize(customer.PreferredCurrency),
                    Latitude = jobDto.Latitude,
                    Longitude = jobDto.Longitude,
                    CustomerId = customer.CustomerId,
                    Status = JobStatusEnum.Pending,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _dbContext.Jobs.Add(newJob);
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(newJob));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while creating the job.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> UpdateJobAsync(string userId, string jobId, UpdateJobDTO jobDto)
        {
            try
            {
                var (job, error) = await GetOwnedJobAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (job.Status != JobStatusEnum.Pending)
                {
                    return new WorkaResponse<JobResponseDTO>("Only open jobs can be edited.");
                }

                if (string.IsNullOrWhiteSpace(jobDto.JobName))
                {
                    return new WorkaResponse<JobResponseDTO>("Give the job a name.");
                }

                var address = (jobDto.Address ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(address))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a job location.");
                }

                if (!IsValidLatitude(jobDto.Latitude) || !IsValidLongitude(jobDto.Longitude))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a location from the address lookup.");
                }

                job.Name = jobDto.JobName.Trim();
                job.Description = (jobDto.JobDescription ?? string.Empty).Trim();
                job.Category = (jobDto.Category ?? string.Empty).Trim();
                job.Address = address;
                job.LocationLabel = string.IsNullOrWhiteSpace(jobDto.LocationLabel)
                    ? address
                    : jobDto.LocationLabel.Trim();
                job.PhotoUrl = UploadPaths.SanitizeJobPhoto(jobDto.PhotoUrl);
                job.Currency = Currencies.Sanitize(
                    string.IsNullOrWhiteSpace(jobDto.Currency) ? job.Currency : jobDto.Currency);
                job.Latitude = jobDto.Latitude;
                job.Longitude = jobDto.Longitude;
                job.UpdatedAt = DateTimeOffset.UtcNow;

                await _dbContext.SaveChangesAsync();
                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while updating the job.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> DeleteJobAsync(string userId, string jobId)
        {
            try
            {
                var (job, error) = await GetOwnedJobAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (job.Status == JobStatusEnum.Accepted)
                {
                    return new WorkaResponse<JobResponseDTO>(
                        "This job is booked and paid. Contact support to cancel a booked job.");
                }

                var quotes = await _dbContext.Quotes
                    .Where(quote => quote.JobId == job.JobId)
                    .ToListAsync();
                _dbContext.Quotes.RemoveRange(quotes);
                _dbContext.Jobs.Remove(job);
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while deleting the job.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> CompleteJobAsync(string userId, string jobId)
        {
            try
            {
                var (job, error) = await GetOwnedJobAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (job.Status != JobStatusEnum.Accepted)
                {
                    return new WorkaResponse<JobResponseDTO>("Only booked jobs can be marked complete.");
                }

                job.Status = JobStatusEnum.Completed;
                job.UpdatedAt = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync();

                // Let the booked professional know the job was marked complete.
                if (_notifications != null && job.AcceptedQuoteId != null)
                {
                    var acceptedQuote = await _dbContext.Quotes
                        .FirstOrDefaultAsync(q => q.QuoteId == job.AcceptedQuoteId);
                    if (acceptedQuote != null)
                    {
                        var pro = await _dbContext.Professionals
                            .FirstOrDefaultAsync(p => p.ProfessionalId == acceptedQuote.ProfessionalId);
                        if (pro != null)
                        {
                            await _notifications.NotifyAsync(
                                pro.UserId,
                                "completed",
                                "Job marked complete",
                                $"\"{job.Name}\" was marked complete. Your payout is on its way.",
                                job.JobId);
                        }
                    }
                }

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while completing the job.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> SetScheduleAsync(string userId, string jobId, DateTimeOffset? scheduledAt)
        {
            try
            {
                var (job, otherUserId, error) = await ResolveBookingParticipantAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (scheduledAt == null)
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a date and time for the appointment.");
                }

                job.ScheduledAt = scheduledAt;
                job.ScheduleConfirmed = false; // a (new) proposed time needs confirming by the other side
                job.UpdatedAt = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync();

                if (_notifications != null && otherUserId != Guid.Empty)
                {
                    await _notifications.NotifyAsync(
                        otherUserId,
                        "booking",
                        "New time proposed",
                        $"A new time was proposed for \"{job.Name}\". Open your bookings to confirm it.",
                        job.JobId);
                }

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while scheduling the job.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> ConfirmScheduleAsync(string userId, string jobId)
        {
            try
            {
                var (job, otherUserId, error) = await ResolveBookingParticipantAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (job.ScheduledAt == null)
                {
                    return new WorkaResponse<JobResponseDTO>("No time has been proposed yet.");
                }

                job.ScheduleConfirmed = true;
                job.UpdatedAt = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync();

                if (_notifications != null && otherUserId != Guid.Empty)
                {
                    await _notifications.NotifyAsync(
                        otherUserId,
                        "booking",
                        "Time confirmed",
                        $"The appointment for \"{job.Name}\" is confirmed.",
                        job.JobId);
                }

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while confirming the time.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> InviteProfessionalAsync(string userId, string jobId, string professionalId)
        {
            try
            {
                var (job, error) = await GetOwnedJobAsync(userId, jobId);
                if (error != null)
                {
                    return new WorkaResponse<JobResponseDTO>(error);
                }

                if (job.AcceptedQuoteId != null || job.Status != JobStatusEnum.Pending)
                {
                    return new WorkaResponse<JobResponseDTO>("You can only invite professionals to an open job.");
                }

                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return new WorkaResponse<JobResponseDTO>("Invalid professional ID format.");
                }

                var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.ProfessionalId == professionalGuid);
                if (professional == null)
                {
                    return new WorkaResponse<JobResponseDTO>("Professional not found.");
                }

                var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.CustomerId == job.CustomerId);
                if (customer != null && professional.UserId == customer.UserId)
                {
                    return new WorkaResponse<JobResponseDTO>("You can't invite yourself.");
                }

                if (_notifications != null)
                {
                    await _notifications.NotifyAsync(
                        professional.UserId,
                        "quote",
                        "You've been invited to quote",
                        $"A customer invited you to quote on \"{job.Name}\".",
                        job.JobId);
                }

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while sending the invite.");
            }
        }

        /// <summary>
        /// Resolves the booked job the caller may schedule and the other party's
        /// user id (for notifying them). Only the job's customer or the booked
        /// professional may touch the schedule, and only once the job is booked.
        /// </summary>
        private async Task<(Job Job, Guid OtherUserId, string Error)> ResolveBookingParticipantAsync(
            string userId, string jobId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return (null, Guid.Empty, "Invalid user identity.");
            }

            if (!Guid.TryParse(jobId, out var jobGuid))
            {
                return (null, Guid.Empty, "Invalid job ID format.");
            }

            var job = await _dbContext.Jobs.FirstOrDefaultAsync(j => j.JobId == jobGuid);
            if (job == null)
            {
                return (null, Guid.Empty, "Job not found.");
            }

            if (job.AcceptedQuoteId == null || job.Status != JobStatusEnum.Accepted)
            {
                return (null, Guid.Empty, "Only booked jobs can be scheduled.");
            }

            var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.CustomerId == job.CustomerId);
            var acceptedQuote = await _dbContext.Quotes.FirstOrDefaultAsync(q => q.QuoteId == job.AcceptedQuoteId);
            var professional = acceptedQuote == null
                ? null
                : await _dbContext.Professionals.FirstOrDefaultAsync(p => p.ProfessionalId == acceptedQuote.ProfessionalId);

            var customerUserId = customer?.UserId ?? Guid.Empty;
            var professionalUserId = professional?.UserId ?? Guid.Empty;

            if (userGuid == customerUserId)
            {
                return (job, professionalUserId, null);
            }

            if (userGuid == professionalUserId)
            {
                return (job, customerUserId, null);
            }

            return (null, Guid.Empty, "You are not part of this booking.");
        }

        private async Task<(Job Job, string Error)> GetOwnedJobAsync(string userId, string jobId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return (null, "Invalid user identity.");
            }

            if (!Guid.TryParse(jobId, out var jobGuid))
            {
                return (null, "Invalid job ID format.");
            }

            var customer = await _dbContext.Customers
                .FirstOrDefaultAsync(c => c.UserId == userGuid);
            if (customer == null)
            {
                return (null, "Customer profile not found.");
            }

            var job = await _dbContext.Jobs
                .FirstOrDefaultAsync(j => j.JobId == jobGuid && j.CustomerId == customer.CustomerId);
            if (job == null)
            {
                return (null, "Job not found.");
            }

            return (job, null);
        }

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForCustomerUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Invalid user identity.");
                }

                var customer = await _dbContext.Customers
                    .FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Customer profile not found.");
                }

                var jobs = await _dbContext.Jobs
                    .Where(job => job.CustomerId == customer.CustomerId)
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<JobResponseDTO>>(jobs.Select(job => new JobResponseDTO(job)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving the jobs.");
            }
        }

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForProfessionalUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Invalid user identity.");
                }

                var professional = await _dbContext.Professionals
                    .FirstOrDefaultAsync(p => p.UserId == userGuid);
                if (professional == null)
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Professional profile not found.");
                }

                var quoteIdsByJob = await _dbContext.Quotes
                    .Where(quote => quote.ProfessionalId == professional.ProfessionalId)
                    .Select(quote => new { quote.JobId, quote.QuoteId })
                    .ToListAsync();
                var quoteJobIds = quoteIdsByJob.Select(q => q.JobId).Distinct().ToList();
                var myQuoteIds = quoteIdsByJob.Select(q => q.QuoteId).ToHashSet();

                if (!quoteJobIds.Any())
                {
                    return new WorkaResponse<List<JobResponseDTO>>(new List<JobResponseDTO>());
                }

                var jobs = await _dbContext.Jobs
                    .Where(job => quoteJobIds.Contains(job.JobId))
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<JobResponseDTO>>(await BuildJobDtosAsync(jobs, myQuoteIds));
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving professional jobs.");
            }
        }

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetAllJobsAsync(string userId = null)
        {
            try
            {
                var jobs = await _dbContext.Jobs
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                // The marketplace list only ever shows the area. The exact
                // address is reserved for the professional whose quote was
                // accepted and paid.
                var myQuoteIds = new HashSet<Guid>();
                if (Guid.TryParse(userId, out var userGuid))
                {
                    var professional = await _dbContext.Professionals
                        .FirstOrDefaultAsync(p => p.UserId == userGuid);
                    if (professional != null)
                    {
                        myQuoteIds = (await _dbContext.Quotes
                            .Where(quote => quote.ProfessionalId == professional.ProfessionalId)
                            .Select(quote => quote.QuoteId)
                            .ToListAsync()).ToHashSet();
                    }

                    // Mode switching means the caller may also be a customer:
                    // never surface their own postings in the marketplace.
                    var ownCustomer = await _dbContext.Customers
                        .FirstOrDefaultAsync(c => c.UserId == userGuid);
                    if (ownCustomer != null)
                    {
                        jobs = jobs.Where(job => job.CustomerId != ownCustomer.CustomerId).ToList();
                    }
                }

                return new WorkaResponse<List<JobResponseDTO>>(await BuildJobDtosAsync(jobs, myQuoteIds));
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving all jobs.");
            }
        }

        private static bool IsBookedByProfessional(Job job, HashSet<Guid> professionalQuoteIds)
        {
            return job.AcceptedQuoteId.HasValue && professionalQuoteIds.Contains(job.AcceptedQuoteId.Value);
        }

        // Builds job DTOs and attaches each job customer's languages (comma-separated
        // ISO codes) so the marketplace can show and filter by language fit.
        private async Task<List<JobResponseDTO>> BuildJobDtosAsync(List<Job> jobs, HashSet<Guid> myQuoteIds)
        {
            var customerIds = jobs.Select(job => job.CustomerId).Distinct().ToList();
            var languagesByCustomer = await _dbContext.Customers
                .Where(customer => customerIds.Contains(customer.CustomerId))
                .Select(customer => new { customer.CustomerId, customer.Languages })
                .ToDictionaryAsync(entry => entry.CustomerId, entry => entry.Languages);

            return jobs.Select(job =>
            {
                var dto = new JobResponseDTO(job, maskLocation: !IsBookedByProfessional(job, myQuoteIds));
                dto.CustomerLanguages = languagesByCustomer.TryGetValue(job.CustomerId, out var langs)
                    ? (langs ?? string.Empty)
                    : string.Empty;
                return dto;
            }).ToList();
        }

        private static bool IsValidLatitude(double? value)
        {
            return value.HasValue
                && !double.IsNaN(value.Value)
                && value.Value >= -90
                && value.Value <= 90;
        }

        private static bool IsValidLongitude(double? value)
        {
            return value.HasValue
                && !double.IsNaN(value.Value)
                && value.Value >= -180
                && value.Value <= 180;
        }
    }
}
