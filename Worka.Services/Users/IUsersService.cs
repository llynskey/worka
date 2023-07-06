namespace Worka.Services.Users
{
    public interface IUsersService
    {
        Task<bool> CreateUserAsync(UserServiceModel userServiceModel);
    }
}
