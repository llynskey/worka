using System.Text.RegularExpressions;
using Worka.Services.Customers;
using Worka.Services.DTOs.Users;
using Worka.Services.Enums;
using Worka.Services.Professionals;
using Worka.Services.Users;
using Xunit;

namespace Worka.Tests
{
    public class AccountManagementTests
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

        private static UserRegisterDTO Registration(string email = "user@example.com") => new()
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            Password = "original-password",
            AccountType = AccountTypeEnum.Customer
        };

        [Fact]
        public async Task ChangePassword_works_and_old_password_stops_working()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);
            var created = await service.CreateUserAsync(Registration());

            var change = await service.ChangePasswordAsync(created.Data.UserId, new ChangePasswordDTO
            {
                CurrentPassword = "original-password",
                NewPassword = "brand-new-password"
            });
            Assert.True(change.Success);

            var oldLogin = await service.AuthUserAsync(new UserLoginDTO
            {
                Email = "user@example.com",
                Password = "original-password"
            });
            Assert.False(oldLogin.Success);

            var newLogin = await service.AuthUserAsync(new UserLoginDTO
            {
                Email = "user@example.com",
                Password = "brand-new-password"
            });
            Assert.True(newLogin.Success);
        }

        [Fact]
        public async Task ChangePassword_rejects_wrong_current_password()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);
            var created = await service.CreateUserAsync(Registration());

            var change = await service.ChangePasswordAsync(created.Data.UserId, new ChangePasswordDTO
            {
                CurrentPassword = "not-the-password",
                NewPassword = "brand-new-password"
            });

            Assert.False(change.Success);
        }

        [Fact]
        public async Task DeleteAccount_requires_correct_password_and_removes_user()
        {
            using var db = TestHelpers.CreateDbContext();
            var service = CreateService(db);
            var created = await service.CreateUserAsync(Registration());

            var wrong = await service.DeleteAccountAsync(created.Data.UserId, new DeleteAccountDTO
            {
                Password = "wrong"
            });
            Assert.False(wrong.Success);
            Assert.Single(db.Users);

            var right = await service.DeleteAccountAsync(created.Data.UserId, new DeleteAccountDTO
            {
                Password = "original-password"
            });
            Assert.True(right.Success);
            Assert.Empty(db.Users);
        }

        [Fact]
        public async Task Forgot_then_reset_password_flow_works_end_to_end()
        {
            using var db = TestHelpers.CreateDbContext();
            var email = new FakeEmailService();
            var service = CreateService(db, email);
            await service.CreateUserAsync(Registration());

            var forgot = await service.ForgotPasswordAsync(new ForgotPasswordDTO
            {
                Email = "USER@example.com "
            });
            Assert.True(forgot.Success);
            var sent = Assert.Single(email.Sent);

            var tokenMatch = Regex.Match(sent.Body, @"\?reset=([0-9a-f]+)");
            Assert.True(tokenMatch.Success, "reset link should contain a token");
            var token = tokenMatch.Groups[1].Value;

            var reset = await service.ResetPasswordAsync(new ResetPasswordDTO
            {
                Token = token,
                NewPassword = "reset-password-1"
            });
            Assert.True(reset.Success);

            var login = await service.AuthUserAsync(new UserLoginDTO
            {
                Email = "user@example.com",
                Password = "reset-password-1"
            });
            Assert.True(login.Success);

            // Token is single-use.
            var reuse = await service.ResetPasswordAsync(new ResetPasswordDTO
            {
                Token = token,
                NewPassword = "another-password"
            });
            Assert.False(reuse.Success);
        }

        [Fact]
        public async Task ForgotPassword_email_is_localized_by_request_language()
        {
            using var db = TestHelpers.CreateDbContext();
            var email = new FakeEmailService();
            var service = CreateService(db, email);
            await service.CreateUserAsync(Registration());

            var de = await service.ForgotPasswordAsync(new ForgotPasswordDTO
            {
                Email = "user@example.com",
                Language = "de"
            });
            Assert.True(de.Success);
            var german = Assert.Single(email.Sent);
            Assert.Equal("Setze dein Fixa-Passwort zurück", german.Subject);
            Assert.Contains("innerhalb einer Stunde", german.Body);
            Assert.Contains("?reset=", german.Body);

            email.Sent.Clear();

            // No/unknown language falls back to English.
            var en = await service.ForgotPasswordAsync(new ForgotPasswordDTO
            {
                Email = "user@example.com",
                Language = ""
            });
            Assert.True(en.Success);
            var english = Assert.Single(email.Sent);
            Assert.Equal("Reset your Fixa password", english.Subject);
        }

        [Fact]
        public async Task ForgotPassword_does_not_reveal_unknown_emails()
        {
            using var db = TestHelpers.CreateDbContext();
            var email = new FakeEmailService();
            var service = CreateService(db, email);

            var result = await service.ForgotPasswordAsync(new ForgotPasswordDTO
            {
                Email = "nobody@example.com"
            });

            Assert.True(result.Success);
            Assert.Empty(email.Sent);
        }
    }
}
