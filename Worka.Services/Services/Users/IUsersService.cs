using Worka.Services.DTOs.Users;
using Worka.Services.Common;
namespace Worka.Services.Users
{
    public interface IUsersService
    {
        Task<ApiResponse<UserResponseDTO>> AuthUserAsync(UserLoginDTO loginRequest);
        Task<ApiResponse<UserResponseDTO>> CreateUserAsync(UserRegisterDTO userServiceModel);
    }
}
