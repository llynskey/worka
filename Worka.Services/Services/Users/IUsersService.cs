using Worka.Services.DTOs.Users;
using Worka.Services.Common;
namespace Worka.Services.Users
{
    public interface IUsersService
    {
        Task<WorkaResponse<UserResponseDTO>> AuthUserAsync(UserLoginDTO loginRequest);
        Task<WorkaResponse<UserResponseDTO>> CreateUserAsync(UserRegisterDTO userServiceModel);
        Task<WorkaResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDTO request);
        Task<WorkaResponse<bool>> DeleteAccountAsync(string userId, DeleteAccountDTO request);
        Task<WorkaResponse<bool>> ForgotPasswordAsync(ForgotPasswordDTO request);
        Task<WorkaResponse<bool>> ResetPasswordAsync(ResetPasswordDTO request);
    }
}
