using Worka.Services.Common;
using Worka.Services.DTOs.Interest;

namespace Worka.Services.Interest
{
    public interface IInterestRegistrationService
    {
        Task<WorkaResponse<InterestRegistrationResponseDTO>> RegisterAsync(CreateInterestRegistrationDTO request);
    }
}
