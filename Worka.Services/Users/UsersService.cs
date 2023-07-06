using Worka.Services.Database;

namespace Worka.Services.Users
{
    public class UsersService : IUsersService
    {
        private readonly MongoHelperContext MongoContext;

        public UsersService(MongoHelperContext context)
        {
            MongoContext = context;
        }

        public async Task<bool> CreateUserAsync(UserServiceModel userServiceModel)
        {
            if (ValidEmail(userServiceModel.Email))
            {
                await MongoContext.Users.InsertOneAsync(new User
                {
                    FirstName = userServiceModel.FirstName,
                    Email = userServiceModel.Email,
                    LastName = userServiceModel.LastName,
                    Password = userServiceModel.Password,
                    CreatedDate = DateTime.Now
                });

                return true;
            }

            return false;
        }

        protected bool ValidEmail(string email)
        {
            // Filter to use for User to check email doesn't exist
            var filter = Builders<User>.Filter.Eq("Email", email);

            if (MongoContext.Users.Find(filter).Any())
            {
                return false;
            }

            return true;
        }
    }
}
