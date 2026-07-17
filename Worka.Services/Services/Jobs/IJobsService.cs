using Worka.Services.Common;
using Worka.Services.DTOs.Jobs;

namespace Worka.Services.Jobs
{
    public interface IJobsService
    {
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForCustomerUserAsync(string userId);
        Task<WorkaResponse<List<JobResponseDTO>>> GetJobsForProfessionalUserAsync(string userId);
        Task<WorkaResponse<JobResponseDTO>> CreateJobAsync(string userId, CreateJobDTO jobDto);
        Task<WorkaResponse<JobResponseDTO>> UpdateJobAsync(string userId, string jobId, UpdateJobDTO jobDto);
        Task<WorkaResponse<JobResponseDTO>> DeleteJobAsync(string userId, string jobId);
        Task<WorkaResponse<JobResponseDTO>> CompleteJobAsync(string userId, string jobId);
        Task<WorkaResponse<JobResponseDTO>> SetScheduleAsync(string userId, string jobId, DateTimeOffset? scheduledAt);
        Task<WorkaResponse<JobResponseDTO>> ConfirmScheduleAsync(string userId, string jobId);
        Task<WorkaResponse<JobResponseDTO>> InviteProfessionalAsync(string userId, string jobId, string professionalId);
        Task<WorkaResponse<List<JobResponseDTO>>> GetAllJobsAsync(string userId = null);
    }
}
