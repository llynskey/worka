using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Worka.Services.Common;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public class JobsService : IJobsService
    {
        private readonly MongoHelperContext _mongoHelperContext;

        public JobsService(MongoHelperContext mongoHelperContext)
        {
            _mongoHelperContext = mongoHelperContext;
        }

        public async Task<ApiResponse<JobResponseDTO>> CreateJobAsync(CreateJobDTO jobDto)
        {
            try
            {
                var newJob = new Job
                {
                    Name = jobDto.JobName,
                    Description = jobDto.JobDescription,
                    CustomerId = new ObjectId(jobDto.CustomerId.ToString())
                };

                await _mongoHelperContext.Jobs.InsertOneAsync(newJob);

                var jobResponseDTO = new JobResponseDTO(newJob);
                return new ApiResponse<JobResponseDTO>(jobResponseDTO);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<JobResponseDTO>("An error occurred while creating the job.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<JobResponseDTO>>> GetJobsByCustomerIdAsync(string customerId)
        {
            try
            {
                var objectIdCustomerId = new ObjectId(customerId);
                var jobs = await _mongoHelperContext.Jobs.Find(j => j.CustomerId == objectIdCustomerId).ToListAsync();

                var jobResponseDTOs = jobs.Select(job => new JobResponseDTO(job)).ToList();
                return new ApiResponse<List<JobResponseDTO>>(jobResponseDTOs);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<JobResponseDTO>>("An error occurred while retrieving the jobs.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<JobResponseDTO>>> GetJobsByProfessionalIdAsync(string professionalId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<List<JobResponseDTO>>> GetAllJobsAsync()
        {
            try
            {
                var jobs = await _mongoHelperContext.Jobs.Find(_ => true).ToListAsync();
                var jobResponseDTOs = jobs.Select(job => new JobResponseDTO(job)).ToList();
                return new ApiResponse<List<JobResponseDTO>>(jobResponseDTOs);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<JobResponseDTO>>("An error occurred while retrieving all jobs.", ex.Message);
            }
        }

        public async Task<ApiResponse<JobResponseDTO>> AcceptQuoteAsync(string jobId, string quoteId)
        {
            try
            {
                var quoteObjectId = ObjectId.Parse(quoteId);
                var filter = Builders<Job>.Filter.Eq(j => j.JobId, ObjectId.Parse(jobId));
                var update = Builders<Job>.Update.Set(j => j.AcceptedQuoteId, quoteObjectId);

                var updatedJob = await _mongoHelperContext.Jobs.FindOneAndUpdateAsync(filter, update);

                var jobResponseDTO = new JobResponseDTO(updatedJob);
                return new ApiResponse<JobResponseDTO>(jobResponseDTO);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<JobResponseDTO>("An error occurred while accepting the quote.", ex.Message);
            }
        }
    }
}
