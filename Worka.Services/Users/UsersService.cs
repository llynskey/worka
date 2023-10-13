using System.Security.Claims;
using System.Text;
using Worka.Services.DTOs.Users;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;

namespace Worka.Services.Users
{
    public class UsersService : IUsersService
    {
        private readonly MongoHelperContext MongoContext;

        public UsersService(MongoHelperContext context)
        {
            MongoContext = context;
        }

        public async Task<string> AuthUserAsync(UserLoginDTO loginRequest)
        {
            try
            {
                User user = await MongoContext.Users.Find(u => u.Email == loginRequest.Email).FirstOrDefaultAsync();

                return (user != null && HashPasswordWithSalt(loginRequest.Password, user.PasswordSalt).SequenceEqual(user.PasswordHash))
                       ? BuildToken(user.UserId.ToString(), user.Email, "customer")
                       : null;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // Utility method to hash password with a given salt
        private byte[] HashPasswordWithSalt(string password, byte[] salt)
        {
            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 1000);
            return pbkdf2.GetBytes(32);
        }

        protected bool IsEmailAvailable(string email)
        {
            var filter = Builders<User>.Filter.Eq("Email", email);
            return !MongoContext.Users.Find(filter).Any();
        }

        private (byte[] Hash, byte[] Salt) HashPassword(string password)
        {
            var salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 1000);
            return (pbkdf2.GetBytes(32), salt);
        }

        public async Task<bool> CreateUserAsync(UserRegisterDTO request)
        {
            if (IsEmailAvailable(request.Email))
            {
                var (hash, salt) = HashPassword(request.Password);
                await MongoContext.Users.InsertOneAsync(new User
                {
                    FirstName = request.FirstName,
                    Email = request.Email,
                    LastName = request.LastName,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    CreatedDate = DateTime.Now
                });
                return true;
            }
            return false;
        }

        //TODO : set secret to change on system time
        public string secret = "ec98e4092525b2da608f304082eaf1cbe873298942da32afea25d7536818887c";
        public string BuildToken(string _id, string username, string type)
        {
            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));


            var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
            var claims = new Claim[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, _id),
                new Claim("Username",username),
                new Claim("Type", type)
            };
            var jwt = new JwtSecurityToken(claims: claims, signingCredentials: signingCredentials);
            var encodedJwt = new JwtSecurityTokenHandler().WriteToken(jwt);

            return encodedJwt;
        }


    }
}

