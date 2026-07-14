using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Worka.Services.Database;
using Worka.Services.Email;

namespace Worka.Tests
{
    /// <summary>Captures outgoing emails so tests can assert on them.</summary>
    public class FakeEmailService : IEmailService
    {
        public bool IsConfigured => true;

        public List<(string To, string Subject, string Body)> Sent { get; } = new();

        public Task SendAsync(string toEmail, string subject, string textBody)
        {
            Sent.Add((toEmail, subject, textBody));
            return Task.CompletedTask;
        }
    }

    public static class TestHelpers
    {
        public const string JwtSecret = "unit-test-secret-that-is-long-enough-for-hmac-sha256";

        public static WorkaDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<WorkaDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new WorkaDbContext(options);
        }

        public static IConfiguration CreateConfiguration()
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["JwtSecret"] = JwtSecret
                })
                .Build();
        }
    }
}
