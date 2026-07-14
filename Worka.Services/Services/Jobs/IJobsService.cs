using Worka.Services.Common;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public interface IJobsService
    {
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForCustomerUserAsync(string userId);
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForProfessionalUserAsync(string userId);
        Task<WorkaResponse<JobResponseDTO>> CreateJobAsync(string userId, CreateJobDTO jobDto);
        Task<WorkaResponse<List<JobResponseDTO>>> GetAllJobsAsync();
    }
}
