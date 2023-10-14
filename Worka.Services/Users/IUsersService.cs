using Worka.Services.DTOs.Users;

namespace Worka.Services.Users
{
    public interface IUsersService
    {
        Task<string> AuthUserAsync(UserLoginDTO loginRequest);
        Task<string> CreateUserAsync(UserRegisterDTO userServiceModel);
    }
}
