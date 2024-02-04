using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Common;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public class JobsService : IJobsService
    {
        public MongoHelperContext _mongoHelperContext { get; set; }
        public JobsService(MongoHelperContext mongoHelperContext) {
            _mongoHelperContext = mongoHelperContext;
        }
        public async Task<ApiResponse<JobResponseDTO>> CreateJobAsync(CreateJobDTO JobDto)
        {

            try
            {
                Job newJob = new Job
                {
                    Name = JobDto.JobName,
                    Description = JobDto.JobDescription,
                    CustomerId = JobDto.CustomerId
                };

                var insertedJob = _mongoHelperContext.Jobs.InsertOneAsync(newJob);

                JobResponseDTO jobResponseDTO = new JobResponseDTO();

                jobResponseDTO.JobName = JobDto.JobName;
                jobResponseDTO.JobDescription = JobDto.JobDescription;
                jobResponseDTO.CustomerId = JobDto.CustomerId.ToString();

                return new ApiResponse<JobResponseDTO>(jobResponseDTO);

            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ApiResponse<List<JobResponseDTO>>> GetJobsByCustomerIdAsync(string customerId)
        {
            try
            {
                var objectIdCustomerId = new ObjectId(customerId);
                var jobs = await _mongoHelperContext.Jobs.Find(j => j.CustomerId == objectIdCustomerId).ToListAsync();

                var jobResponseDTOs = jobs.Select(job => new JobResponseDTO
                {
                    // Map properties from Job to JobResponseDTO
                    JobName = job.Name,
                    JobDescription = job.Description,
                    CustomerId = job.CustomerId.ToString(),
                    JobId = job.JobId.ToString(),
                }).ToList();

                return new ApiResponse<List<JobResponseDTO>>(jobResponseDTOs);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<JobResponseDTO>>("An error occurred while retrieving the jobs.");
            }
        }


        public Task<ApiResponse<List<JobResponseDTO>>> GetJobsByProfessionalIdAsync(string professionalId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<List<JobResponseDTO>>> GetAllJobs()
        {
           var jobs = await _mongoHelperContext.Jobs.Find(_ => true).ToListAsync();

            var jobsResponseDto = jobs.Select(j => new JobResponseDTO
            {
                JobId = j.JobId.ToString(),
                CustomerId= j.CustomerId.ToString(),
                JobName = j.Name,
                JobDescription = j.Description,
                JobStatus = j.Status,
                AcceptedQuoteId = j.AcceptedQuoteId.ToString()
            }).ToList();

            return new ApiResponse<List<JobResponseDTO>>(jobsResponseDto);
        }
    }
}
