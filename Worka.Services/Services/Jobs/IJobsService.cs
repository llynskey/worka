using Worka.Services.Common;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public interface IJobsService
    {
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsByCustomerIdAsync(string customerId);
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsByProfessionalIdAsync(string professionalId);
        Task<WorkaResponse<JobResponseDTO>> CreateJobAsync(CreateJobDTO JobDto);
        Task<WorkaResponse<JobResponseDTO>> AcceptQuoteAsync(string jobId, string quoteId);
        Task<WorkaResponse<List<JobResponseDTO>>> GetAllJobsAsync();
    }
}
