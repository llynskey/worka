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
                var photoUrl = string.IsNullOrWhiteSpace(jobDto.PhotoUrl)
                    ? string.Empty
                    : jobDto.PhotoUrl.Trim();

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

                var quoteJobIds = await _dbContext.Quotes
                    .Where(quote => quote.ProfessionalId == professional.ProfessionalId)
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
