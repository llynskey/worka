using Worka.Services.Common;
using Worka.Services.DTOs.Reviews;

namespace Worka.Services.Reviews
{
    public interface IReviewsService
    {
        Task<WorkaResponse<ReviewResponseDTO>> CreateReviewAsync(string userId, string jobId, CreateReviewDTO review);
        Task<WorkaResponse<List<ReviewResponseDTO>>> GetForProfessionalAsync(string professionalId);
    }
}
