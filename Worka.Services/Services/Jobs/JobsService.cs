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

        public async Task<WorkaResponse<JobResponseDTO>> CreateJobAsync(CreateJobDTO jobDto)
        {
            try
            {
                if (!Guid.TryParse(jobDto.CustomerId, out var customerId))
                {
                    return new WorkaResponse<JobResponseDTO>("Invalid customer ID format.");
                }

                var address = jobDto.Address.Trim();
                var locationLabel = string.IsNullOrWhiteSpace(jobDto.LocationLabel)
                    ? address
                    : jobDto.LocationLabel.Trim();
                var photoUrl = string.IsNullOrWhiteSpace(jobDto.PhotoUrl)
                    ? string.Empty
                    : jobDto.PhotoUrl.Trim();

                if (string.IsNullOrWhiteSpace(address))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a job location.");
                }

                if (!IsValidLatitude(jobDto.Latitude) || !IsValidLongitude(jobDto.Longitude))
                {
                    return new WorkaResponse<JobResponseDTO>("Choose a location from the address lookup.");
                }

                var customerExists = await _dbContext.Customers.AnyAsync(customer => customer.CustomerId == customerId);
                if (!customerExists)
                {
                    return new WorkaResponse<JobResponseDTO>("Customer profile not found.");
                }

                var newJob = new Job
                {
                    Name = jobDto.JobName.Trim(),
                    Description = jobDto.JobDescription.Trim(),
                    Category = jobDto.Category.Trim(),
                    Address = address,
                    LocationLabel = locationLabel,
                    PhotoUrl = photoUrl,
                    Latitude = jobDto.Latitude,
                    Longitude = jobDto.Longitude,
                    CustomerId = customerId,
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

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetJobsByCustomerIdAsync(string customerId)
        {
            try
            {
                if (!Guid.TryParse(customerId, out var customerGuid))
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Invalid customer ID format.");
                }

                var jobs = await _dbContext.Jobs
                    .Where(job => job.CustomerId == customerGuid)
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<JobResponseDTO>>(jobs.Select(job => new JobResponseDTO(job)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving the jobs.");
            }
        }

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetJobsByProfessionalIdAsync(string professionalId)
        {
            try
            {
                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return new WorkaResponse<List<JobResponseDTO>>("Invalid professional ID format.");
                }

                var quoteJobIds = await _dbContext.Quotes
                    .Where(quote => quote.ProfessionalId == professionalGuid)
                    .Select(quote => quote.JobId)
                    .Distinct()
                    .ToListAsync();

                if (!quoteJobIds.Any())
                {
                    return new WorkaResponse<List<JobResponseDTO>>(new List<JobResponseDTO>());
                }

                var jobs = await _dbContext.Jobs
                    .Where(job => quoteJobIds.Contains(job.JobId))
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<JobResponseDTO>>(jobs.Select(job => new JobResponseDTO(job)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving professional jobs.");
            }
        }

        public async Task<WorkaResponse<List<JobResponseDTO>>> GetAllJobsAsync()
        {
            try
            {
                var jobs = await _dbContext.Jobs
                    .OrderByDescending(job => job.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<JobResponseDTO>>(jobs.Select(job => new JobResponseDTO(job)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobResponseDTO>>.Fail(ex, "An error occurred while retrieving all jobs.");
            }
        }

        public async Task<WorkaResponse<JobResponseDTO>> AcceptQuoteAsync(string jobId, string quoteId)
        {
            try
            {
                if (!Guid.TryParse(jobId, out var jobGuid))
                {
                    return new WorkaResponse<JobResponseDTO>("Invalid job ID format.");
                }

                if (!Guid.TryParse(quoteId, out var quoteGuid))
                {
                    return new WorkaResponse<JobResponseDTO>("Invalid quote ID format.");
                }

                var quote = await _dbContext.Quotes
                    .FirstOrDefaultAsync(q => q.QuoteId == quoteGuid && q.JobId == jobGuid);

                if (quote == null)
                {
                    return new WorkaResponse<JobResponseDTO>("Quote not found for this job.");
                }

                var job = await _dbContext.Jobs.FirstOrDefaultAsync(j => j.JobId == jobGuid);
                if (job == null)
                {
                    return new WorkaResponse<JobResponseDTO>("Job not found.");
                }

                job.AcceptedQuoteId = quoteGuid;
                job.Status = JobStatusEnum.Accepted;
                job.UpdatedAt = DateTimeOffset.UtcNow;

                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<JobResponseDTO>(new JobResponseDTO(job));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobResponseDTO>.Fail(ex, "An error occurred while accepting the quote.");
            }
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
