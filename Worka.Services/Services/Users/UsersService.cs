using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Worka.Services.Common;
using Worka.Services.Customers;
using Worka.Services.Database;
using Worka.Services.DTOs.Users;
using Worka.Services.Enums;
using Worka.Services.Professionals;

namespace Worka.Services.Users
{
    public class UsersService : IUsersService
    {
        private const int PasswordIterations = 100_000;

        private readonly WorkaDbContext _dbContext;
        private readonly ICustomerService _customerService;
        private readonly IProfessionalsService _professionalsService;
        private readonly string JwtSecret;

        public UsersService(
            WorkaDbContext dbContext,
            IConfiguration configuration,
            ICustomerService customerService,
            IProfessionalsService professionalsService)
        {
            _dbContext = dbContext;
            _customerService = customerService;
            _professionalsService = professionalsService;
            JwtSecret = configuration.GetRequiredSection("JwtSecret").Value
                ?? throw new ArgumentNullException("JwtSecret", "JWT Secret is not configured.");
        }

        public async Task<WorkaResponse<UserResponseDTO>> AuthUserAsync(UserLoginDTO loginRequest)
        {
            try
            {
                var email = loginRequest.Email.Trim().ToLowerInvariant();
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    return new WorkaResponse<UserResponseDTO>("User not found.");
                }

                if (!IsPasswordValid(loginRequest.Password, user.PasswordSalt, user.PasswordHash))
                {
                    return new WorkaResponse<UserResponseDTO>("Invalid password.");
                }

                await EnsureProfileForUserAsync(user);

                var userResponse = ToUserResponse(user);
                var token = BuildToken(user);
                return new WorkaResponse<UserResponseDTO>(userResponse, token);
            }
            catch (Exception ex)
            {
                return WorkaResponse<UserResponseDTO>.Fail(ex, "Error authenticating user.");
            }
        }

        public async Task<WorkaResponse<UserResponseDTO>> CreateUserAsync(UserRegisterDTO request)
        {
            try
            {
                var email = request.Email.Trim().ToLowerInvariant();
                if (!await IsEmailAvailableAsync(email))
                {
                    return new WorkaResponse<UserResponseDTO>("Email is already in use.");
                }

                var (hash, salt) = HashPassword(request.Password);
                var newUser = new User(
                    request.FirstName.Trim(),
                    request.LastName.Trim(),
                    email,
                    hash,
                    salt,
                    request.AccountType,
                    DateTimeOffset.UtcNow);

                _dbContext.Users.Add(newUser);
                await _dbContext.SaveChangesAsync();
                await EnsureProfileForUserAsync(newUser);

                var userResponse = ToUserResponse(newUser);
                var token = BuildToken(newUser);
                return new WorkaResponse<UserResponseDTO>(userResponse, token);
            }
            catch (Exception ex)
            {
                return WorkaResponse<UserResponseDTO>.Fail(ex, "Error creating user.");
            }
        }

        private async Task EnsureProfileForUserAsync(User user)
        {
            var userId = user.UserId.ToString();
            if (user.AccountType == AccountTypeEnum.Customer)
            {
                await _customerService.EnsureExistsAsync(userId, user.Email, user.FirstName, user.LastName);
                return;
            }

            await _professionalsService.EnsureExistsAsync(userId, user.Email, user.FirstName, user.LastName);
        }

        private static UserResponseDTO ToUserResponse(User user)
        {
            return new UserResponseDTO
            {
                UserId = user.UserId.ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                AccountType = user.AccountType,
                CreatedDate = user.CreatedDate
            };
        }

        private static bool IsPasswordValid(string password, byte[] salt, byte[] expectedHash)
        {
            var computed = HashPasswordWithSalt(password, salt, PasswordIterations);
            return CryptographicOperations.FixedTimeEquals(computed, expectedHash);
        }

        private static byte[] HashPasswordWithSalt(string password, byte[] salt, int iterations)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256);

            return pbkdf2.GetBytes(32);
        }

        private Task<bool> IsEmailAvailableAsync(string email)
        {
            return _dbContext.Users.AllAsync(user => user.Email != email);
        }

        private static (byte[] Hash, byte[] Salt) HashPassword(string password)
        {
            var salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            using var pbkdf2 = new Rfc2898DeriveBytes(
                password,
                salt,
                PasswordIterations,
                HashAlgorithmName.SHA256);

            return (pbkdf2.GetBytes(32), salt);
        }

        private string BuildToken(User user)
        {
            if (string.IsNullOrWhiteSpace(JwtSecret))
            {
                throw new InvalidOperationException("JWT Secret is not set.");
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
            var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
            var role = GetRoleClaim(user.AccountType);

            var claims = new Claim[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("Username", user.Email),
                new Claim("Type", role),
                new Claim("AccountType", role),
                new Claim(ClaimTypes.Role, role)
            };

            var jwt = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(14),
                signingCredentials: signingCredentials);

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }

        private static string GetRoleClaim(AccountTypeEnum accountType)
        {
            return accountType == AccountTypeEnum.Customer ? "customer" : "professional";
        }
    }
}
