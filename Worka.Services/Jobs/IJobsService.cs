using Worka.Services.Common;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public interface IJobsService
    {
        Task<ApiResponse<List<JobResponseDTO>>> GetJobsByCustomerIdAsync(string customerId);
        Task<ApiResponse<List<JobResponseDTO>>> GetJobsByProfessionalIdAsync(string professionalId);
        Task<ApiResponse<JobResponseDTO>> CreateJobAsync(CreateJobDTO JobDto);
        Task<ApiResponse<JobResponseDTO>> AcceptQuoteAsync(string jobId, string quoteId);
        Task<ApiResponse<List<JobResponseDTO>>> GetAllJobs();
    }
}
