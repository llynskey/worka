using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;
using Worka.Services.Enums;
using Worka.Services.Jobs;
using Worka.Services.Quotes;
using Xunit;

namespace Worka.Tests
{
    public class JobsAndQuotesServiceTests
    {
        private static (Guid customerUserId, Guid professionalUserId) Seed(Services.Database.WorkaDbContext db)
        {
            var customerUser = new User(
                "Cara", "Customer", "cara@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Customer, DateTimeOffset.UtcNow);
            var professionalUser = new User(
                "Paul", "Pro", "paul@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Professional, DateTimeOffset.UtcNow);

            db.Users.AddRange(customerUser, professionalUser);
            db.SaveChanges();

            db.Customers.Add(new Customer
            {
                UserId = customerUser.UserId,
                FirstName = "Cara",
                LastName = "Customer",
                Email = "cara@example.com"
            });
            db.Professionals.Add(new Professional
            {
                UserId = professionalUser.UserId,
                FirstName = "Paul",
                LastName = "Pro",
                Email = "paul@example.com"
            });
            db.SaveChanges();

            return (customerUser.UserId, professionalUser.UserId);
        }

        private static CreateJobDTO ValidJob() => new()
        {
            JobName = "Fix leaking tap",
            JobDescription = "Kitchen tap drips constantly.",
            Category = "Plumbing",
            Address = "1 High Street, London",
            Latitude = 51.5,
            Longitude = -0.12
        };

        [Fact]
        public async Task CreateJob_assigns_job_to_callers_customer_profile()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, _) = Seed(db);
            var service = new JobsService(db);

            var result = await service.CreateJobAsync(customerUserId.ToString(), ValidJob());

            Assert.True(result.Success);
            var job = Assert.Single(db.Jobs);
            var customer = Assert.Single(db.Customers.Where(c => c.UserId == customerUserId));
            Assert.Equal(customer.CustomerId, job.CustomerId);
        }

        [Fact]
        public async Task CreateJob_fails_for_professional_identity()
        {
            using var db = TestHelpers.CreateDbContext();
            var (_, professionalUserId) = Seed(db);
            var service = new JobsService(db);

            var result = await service.CreateJobAsync(professionalUserId.ToString(), ValidJob());

            Assert.False(result.Success);
            Assert.Empty(db.Jobs);
        }

        [Fact]
        public async Task CreateJob_rejects_missing_location()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, _) = Seed(db);
            var service = new JobsService(db);

            var job = ValidJob();
            job.Latitude = null;
            job.Longitude = null;

            var result = await service.CreateJobAsync(customerUserId.ToString(), job);

            Assert.False(result.Success);
        }

        [Fact]
        public async Task CreateQuote_assigns_quote_to_callers_professional_profile()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobsService = new JobsService(db);
            var quoteService = new QuoteService(db);

            var jobResult = await jobsService.CreateJobAsync(customerUserId.ToString(), ValidJob());
            Assert.True(jobResult.Success);

            var result = await quoteService.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = jobResult.Data.JobId,
                Price = 120m,
                Description = "Can do this tomorrow."
            });

            Assert.True(result.Success);
            var quote = Assert.Single(db.Quotes);
            var professional = Assert.Single(db.Professionals.Where(p => p.UserId == professionalUserId));
            Assert.Equal(professional.ProfessionalId, quote.ProfessionalId);
        }

        [Fact]
        public async Task CreateQuote_rejects_non_positive_price()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobsService = new JobsService(db);
            var quoteService = new QuoteService(db);

            var jobResult = await jobsService.CreateJobAsync(customerUserId.ToString(), ValidJob());

            var result = await quoteService.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = jobResult.Data.JobId,
                Price = 0m,
                Description = "Free work"
            });

            Assert.False(result.Success);
            Assert.Empty(db.Quotes);
        }

        [Fact]
        public async Task Customer_only_sees_quotes_on_their_own_jobs()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobsService = new JobsService(db);
            var quoteService = new QuoteService(db);

            var jobResult = await jobsService.CreateJobAsync(customerUserId.ToString(), ValidJob());
            await quoteService.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = jobResult.Data.JobId,
                Price = 99m,
                Description = "Quote"
            });

            var ownQuotes = await quoteService.GetQuotesForCustomerUserAsync(customerUserId.ToString());
            Assert.True(ownQuotes.Success);
            Assert.Single(ownQuotes.Data);

            // A professional identity has no customer profile, so the customer view must fail.
            var wrongRole = await quoteService.GetQuotesForCustomerUserAsync(professionalUserId.ToString());
            Assert.False(wrongRole.Success);
        }
    }
}
