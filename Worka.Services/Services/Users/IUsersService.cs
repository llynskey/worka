using Worka.Services.DTOs.Users;
using Worka.Services.Common;
namespace Worka.Services.Users
{
    public interface IUsersService
    {
        Task<WorkaResponse<UserResponseDTO>> AuthUserAsync(UserLoginDTO loginRequest);
        Task<WorkaResponse<UserResponseDTO>> CreateUserAsync(UserRegisterDTO userServiceModel);
    }
}
