using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Worka.Services.Common;
using Worka.Services.Customers;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Users;
using Worka.Services.Email;
using Worka.Services.Enums;
using Worka.Services.Professionals;

namespace Worka.Services.Users
{
    public class UsersService : IUsersService
    {
        private const int PasswordIterations = 100_000;
        private const int MinPasswordLength = 6;

        private readonly WorkaDbContext _dbContext;
        private readonly ICustomerService _customerService;
        private readonly IProfessionalsService _professionalsService;
        private readonly IEmailService _emailService;
        private readonly ILogger<UsersService> _logger;
        private readonly string _publicUrl;
        private readonly string JwtSecret;

        public UsersService(
            WorkaDbContext dbContext,
            IConfiguration configuration,
            ICustomerService customerService,
            IProfessionalsService professionalsService,
            IEmailService emailService,
            ILogger<UsersService> logger = null)
        {
            _dbContext = dbContext;
            _customerService = customerService;
            _professionalsService = professionalsService;
            _emailService = emailService;
            _logger = logger;
            _publicUrl = (configuration["Worka:PublicUrl"] ?? "https://woka.site").TrimEnd('/');
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

        public async Task<WorkaResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDTO request)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<bool>("Invalid user identity.");
                }

                if ((request.NewPassword ?? string.Empty).Length < MinPasswordLength)
                {
                    return new WorkaResponse<bool>($"New password must be at least {MinPasswordLength} characters.");
                }

                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
                if (user == null)
                {
                    return new WorkaResponse<bool>("User not found.");
                }

                if (!IsPasswordValid(request.CurrentPassword ?? string.Empty, user.PasswordSalt, user.PasswordHash))
                {
                    return new WorkaResponse<bool>("Current password is incorrect.");
                }

                var (hash, salt) = HashPassword(request.NewPassword);
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<bool>(true, message: "Password updated.");
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "Error changing password.");
            }
        }

        public async Task<WorkaResponse<bool>> DeleteAccountAsync(string userId, DeleteAccountDTO request)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<bool>("Invalid user identity.");
                }

                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
                if (user == null)
                {
                    return new WorkaResponse<bool>("User not found.");
                }

                if (!IsPasswordValid(request.Password ?? string.Empty, user.PasswordSalt, user.PasswordHash))
                {
                    return new WorkaResponse<bool>("Password is incorrect.");
                }

                // Cascading FKs remove the customer/professional profile and,
                // through them, jobs, quotes, payments, and reset tokens.
                _dbContext.Users.Remove(user);
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<bool>(true, message: "Account deleted.");
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "Error deleting account.");
            }
        }

        public async Task<WorkaResponse<bool>> ForgotPasswordAsync(ForgotPasswordDTO request)
        {
            const string neutralMessage =
                "If that email is registered, a reset link is on its way.";

            try
            {
                var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null || !_emailService.IsConfigured)
                {
                    if (!_emailService.IsConfigured)
                    {
                        _logger?.LogWarning(
                            "Password reset requested but SMTP is not configured (Smtp__Host is empty); no email sent.");
                    }

                    // Same response either way to avoid account enumeration.
                    return new WorkaResponse<bool>(true, message: neutralMessage);
                }

                var tokenBytes = new byte[32];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(tokenBytes);
                }

                var token = Convert.ToHexString(tokenBytes).ToLowerInvariant();
                _dbContext.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId = user.UserId,
                    TokenHash = HashResetToken(token),
                    ExpiresAt = DateTimeOffset.UtcNow.AddHours(1),
                    CreatedAt = DateTimeOffset.UtcNow
                });
                await _dbContext.SaveChangesAsync();

                var resetLink = $"{_publicUrl}/?reset={token}";
                await _emailService.SendAsync(
                    user.Email,
                    "Reset your Worka password",
                    $"Hi {user.FirstName},\n\n" +
                    $"Someone asked to reset the password for this Worka account. " +
                    $"If that was you, open the link below within one hour:\n\n{resetLink}\n\n" +
                    "If you didn't ask for this, you can ignore this email — your password is unchanged.\n\n" +
                    "— Worka");

                return new WorkaResponse<bool>(true, message: neutralMessage);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to send the password reset email.");
                return WorkaResponse<bool>.Fail(ex, "Error processing the reset request.");
            }
        }

        public async Task<WorkaResponse<bool>> ResetPasswordAsync(ResetPasswordDTO request)
        {
            try
            {
                if ((request.NewPassword ?? string.Empty).Length < MinPasswordLength)
                {
                    return new WorkaResponse<bool>($"New password must be at least {MinPasswordLength} characters.");
                }

                var tokenHash = HashResetToken((request.Token ?? string.Empty).Trim());
                var now = DateTimeOffset.UtcNow;
                var resetToken = await _dbContext.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.UsedAt == null && t.ExpiresAt > now);
                if (resetToken == null)
                {
                    return new WorkaResponse<bool>("This reset link is invalid or has expired. Request a new one.");
                }

                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == resetToken.UserId);
                if (user == null)
                {
                    return new WorkaResponse<bool>("User not found.");
                }

                var (hash, salt) = HashPassword(request.NewPassword);
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                resetToken.UsedAt = now;
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<bool>(true, message: "Password reset. You can now log in.");
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "Error resetting the password.");
            }
        }

        private static string HashResetToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes).ToLowerInvariant();
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
