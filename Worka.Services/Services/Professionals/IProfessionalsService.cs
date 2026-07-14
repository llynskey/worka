using Worka.Services.Common;
using Worka.Services.DTOs.Professionals;

namespace Worka.Services.Professionals
{
    public interface IProfessionalsService
    {
        Task<WorkaResponse<ProfessionalResponseDTO>> GetByUserIdAsync(string userId);

        Task<WorkaResponse<ProfessionalResponseDTO>> UpdateAsync(
            string userId,
            string firstName,
            string lastName,
            string email,
            string specialty,
            string bio,
            string serviceArea,
            string languages = null,
            string photoUrl = null);

        Task<WorkaResponse<ProfessionalResponseDTO>> EnsureExistsAsync(
            string userId,
            string email,
            string firstName,
            string lastName);

        Task<WorkaResponse<List<ProfessionalDirectoryItemDTO>>> GetDirectoryAsync(
            string search,
            string specialty,
            string area,
            decimal? maxPrice,
            string language = null);
    }
}
