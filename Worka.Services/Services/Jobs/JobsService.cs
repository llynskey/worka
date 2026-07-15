using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Jobs;
using Worka.Services.Enums;

namespace Worka.Services.Jobs
{
    public class JobsService : IJobsService
    {
        private readonly WorkaDbContext _dbContext;

        public JobsService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
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

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while completing the job.");
            }
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

                return new WorkaResponse<List<JobResponseDTO>>(
                    jobs.Select(job => new JobResponseDTO(job, maskLocation: !IsBookedByProfessional(job, myQuoteIds)))
                        .ToList());
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
                }

                return new WorkaResponse<List<JobResponseDTO>>(
                    jobs.Select(job => new JobResponseDTO(job, maskLocation: !IsBookedByProfessional(job, myQuoteIds)))
                        .ToList());
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
