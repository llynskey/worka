using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Worka.Services.Database;

namespace Worka.Tests
{
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
