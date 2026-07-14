using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Worka.Services.Customers;
using Worka.Services.DTOs.Users;
using Worka.Services.Enums;
using Worka.Services.Professionals;
using Worka.Services.Users;
using Xunit;

namespace Worka.Tests
{
    public class UsersServiceTests
    {
        private static UsersService CreateService(
            Services.Database.WorkaDbContext dbContext,
            FakeEmailService emailService = null)
        {
            return new UsersService(
                dbContext,
                TestHelpers.CreateConfiguration(),
                new CustomersService(dbContext),
                new ProfessionalsService(dbContext),
                emailService ?? new FakeEmailService());
        }

        [Fact]
        public async Task Signup_then_login_succeeds_with_correct_password()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);

            var created = await service.CreateUserAsync(new UserRegisterDTO
            {
                FirstName = "Ada",
                LastName = "Lovelace",
                Email = "ada@example.com",
                Password = "correct horse battery staple",
                AccountType = AccountTypeEnum.Customer
            });

            Assert.True(created.Success);
            Assert.False(string.IsNullOrWhiteSpace(created.Token));

            var login = await service.AuthUserAsync(new UserLoginDTO
            {
                Email = "ADA@example.com ",
                Password = "correct horse battery staple"
            });

            Assert.True(login.Success);
            Assert.False(string.IsNullOrWhiteSpace(login.Token));
        }

        [Fact]
        public async Task Login_fails_with_wrong_password()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);

            await service.CreateUserAsync(new UserRegisterDTO
            {
                FirstName = "Ada",
                LastName = "Lovelace",
                Email = "ada@example.com",
                Password = "right-password",
                AccountType = AccountTypeEnum.Customer
            });

            var login = await service.AuthUserAsync(new UserLoginDTO
            {
                Email = "ada@example.com",
                Password = "wrong-password"
            });

            Assert.False(login.Success);
            Assert.Null(login.Token);
        }

        [Fact]
        public async Task Signup_rejects_duplicate_email()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);

            var request = new UserRegisterDTO
            {
                FirstName = "Ada",
                LastName = "Lovelace",
                Email = "ada@example.com",
                Password = "some-password",
                AccountType = AccountTypeEnum.Customer
            };

            var first = await service.CreateUserAsync(request);
            var second = await service.CreateUserAsync(request);

            Assert.True(first.Success);
            Assert.False(second.Success);
        }

        [Fact]
        public async Task Issued_token_validates_and_carries_identity_and_role_claims()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);

            var created = await service.CreateUserAsync(new UserRegisterDTO
            {
                FirstName = "Grace",
                LastName = "Hopper",
                Email = "grace@example.com",
                Password = "another-password",
                AccountType = AccountTypeEnum.Professional
            });

            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(
                created.Token,
                new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestHelpers.JwtSecret))
                },
                out _);

            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            Assert.False(string.IsNullOrWhiteSpace(userId));
            Assert.True(Guid.TryParse(userId, out _));
            Assert.Equal("professional", principal.FindFirstValue(ClaimTypes.Role));
        }

        [Fact]
        public async Task Signup_provisions_matching_profile()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);

            var created = await service.CreateUserAsync(new UserRegisterDTO
            {
                FirstName = "Alan",
                LastName = "Turing",
                Email = "alan@example.com",
                Password = "enigma-machine",
                AccountType = AccountTypeEnum.Professional
            });

            Assert.True(created.Success);
            var userGuid = Guid.Parse(created.Data.UserId);
            Assert.Single(db.Professionals.Where(p => p.UserId == userGuid));
            Assert.Empty(db.Customers.Where(c => c.UserId == userGuid));
        }
    }
}
