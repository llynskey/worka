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

                JobResponseDTO jobResponseDTO = new JobResponseDTO(newJob);

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

                var jobResponseDTOs = jobs.Select(job => new JobResponseDTO(job)).ToList();

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

            var jobsResponseDto = jobs.Select(job => new JobResponseDTO(job)).ToList();

            return new ApiResponse<List<JobResponseDTO>>(jobsResponseDto);
        }

        public async Task<ApiResponse<JobResponseDTO>> AcceptQuoteAsync(string jobId, string quoteId)
        {
            try
            {
                ObjectId quoteObjectId = ObjectId.Parse(quoteId);

                var filter = Builders<Job>.Filter.Eq(j => j.JobId, ObjectId.Parse(jobId));

                var update = Builders<Job>.Update.Set(j => j.AcceptedQuoteId, quoteObjectId);

                var updatedJob = await _mongoHelperContext.Jobs.FindOneAndUpdateAsync(filter, update);

                var jobResponseDto = new JobResponseDTO(updatedJob);

                return new ApiResponse<JobResponseDTO>(jobResponseDto);
            }
            catch (Exception ex)
            {
                return new ApiResponse<JobResponseDTO>(ex.Message);
            }
        }

    }
}
