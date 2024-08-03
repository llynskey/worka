using System.Security.Claims;
using System.Text;
using Worka.Services.DTOs.Users;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Worka.Services.Common;
using Worka.Services.Enums;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Microsoft.Extensions.Configuration;

namespace Worka.Services.Users
{
    public class UsersService : IUsersService
    {
        private readonly MongoHelperContext MongoContext;
        private readonly string JwtSecret;

        public UsersService(MongoHelperContext context, IConfiguration configuration)
        {
            MongoContext = context;
            JwtSecret = configuration["JwtSecret"] ?? throw new ArgumentNullException("JwtSecret", "JWT Secret is not configured.");
        }

        public async Task<ApiResponse<UserResponseDTO>> AuthUserAsync(UserLoginDTO loginRequest)
        {
            try
            {
                User user = await MongoContext.Users.Find(u => u.Email == loginRequest.Email).FirstOrDefaultAsync();
                if (user == null)
                {
                    return new ApiResponse<UserResponseDTO>("User not found.");
                }

                bool isPasswordValid = HashPasswordWithSalt(loginRequest.Password, user.PasswordSalt).SequenceEqual(user.PasswordHash);
                if (!isPasswordValid)
                {
                    return new ApiResponse<UserResponseDTO>("Invalid password.");
                }

                string token = BuildToken(user.UserId.ToString(), user.Email, "customer");
                var userResponse = new UserResponseDTO
                {
                    UserId = user.UserId.ToString(),
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    AccountType = user.AccountType,
                    CreatedDate = user.CreatedDate
                };
                return new ApiResponse<UserResponseDTO>(userResponse, token);
            }
            catch (Exception ex)
            {
                // Log the exception here
                // logger.LogError(ex, "Error authenticating user.");
                return new ApiResponse<UserResponseDTO>(ex.Message);
            }
        }

        public async Task<ApiResponse<UserResponseDTO>> CreateUserAsync(UserRegisterDTO request)
        {
            try
            {
                if (!IsEmailAvailable(request.Email))
                {
                    return new ApiResponse<UserResponseDTO>("Email is already in use.");
                }

                var (hash, salt) = HashPassword(request.Password);
                var newUser = new User(request.FirstName, request.Email, request.LastName, hash, salt, request.AccountType, DateTimeOffset.UtcNow);

                await MongoContext.Users.InsertOneAsync(newUser);
                var insertedUser = await MongoContext.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();

                if (insertedUser == null)
                {
                    return new ApiResponse<UserResponseDTO>("Failed to retrieve the user after insertion.");
                }

                string token = BuildToken(insertedUser.UserId.ToString(), insertedUser.Email, insertedUser.AccountType.ToString());
                var userResponse = new UserResponseDTO
                {
                    UserId = insertedUser.UserId.ToString(),
                    FirstName = insertedUser.FirstName,
                    LastName = insertedUser.LastName,
                    Email = insertedUser.Email,
                    AccountType = insertedUser.AccountType,
                    CreatedDate = insertedUser.CreatedDate
                };
                return new ApiResponse<UserResponseDTO>(userResponse, token);
            }
            catch (Exception ex)
            {
                // Log the exception here
                // logger.LogError(ex, "Error creating user.");
                return new ApiResponse<UserResponseDTO>(ex.Message);
            }
        }

        private byte[] HashPasswordWithSalt(string password, byte[] salt)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 1000);
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

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 1000);
            return (pbkdf2.GetBytes(32), salt);
        }

        private string BuildToken(string userId, string username, string type)
        {
            if (string.IsNullOrEmpty(JwtSecret))
            {
                throw new InvalidOperationException("JWT Secret is not set.");
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
            var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new Claim[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("Username", username),
                new Claim("Type", type)
            };

            var jwt = new JwtSecurityToken(claims: claims, signingCredentials: signingCredentials);
            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
    }
}
