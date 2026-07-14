using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;
using Worka.Services.Enums;
using Worka.Services.Jobs;
using Worka.Services.Professionals;
using Worka.Services.Quotes;
using Xunit;

namespace Worka.Tests
{
    public class CrudRulesTests
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

            db.Customers.Add(new Customer { UserId = customerUser.UserId, FirstName = "Cara", LastName = "Customer", Email = "cara@example.com" });
            db.Professionals.Add(new Professional { UserId = professionalUser.UserId, FirstName = "Paul", LastName = "Pro", Email = "paul@example.com", ServiceArea = "Leeds", Specialty = "Plumbing" });
            db.SaveChanges();

            return (customerUser.UserId, professionalUser.UserId);
        }

        private static CreateJobDTO ValidJob() => new()
        {
            JobName = "Fix tap",
            JobDescription = "Dripping tap",
            Category = "Plumbing",
            Address = "1 High Street",
            Latitude = 51.5,
            Longitude = -0.12
        };

        [Fact]
        public async Task UpdateJob_changes_details_for_owner()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, _) = Seed(db);
            var jobs = new JobsService(db);
            var created = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());

            var updated = await jobs.UpdateJobAsync(customerUserId.ToString(), created.Data.JobId, new UpdateJobDTO
            {
                JobName = "Fix kitchen tap",
                JobDescription = "New description",
                Category = "Plumbing",
                Address = "1 High Street",
                Latitude = 51.5,
                Longitude = -0.12
            });

            Assert.True(updated.Success);
            Assert.Equal("Fix kitchen tap", updated.Data.JobName);
        }

        [Fact]
        public async Task UpdateJob_rejected_for_non_owner()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobs = new JobsService(db);
            var created = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());

            var updated = await jobs.UpdateJobAsync(professionalUserId.ToString(), created.Data.JobId, new UpdateJobDTO
            {
                JobName = "Hijacked",
                Address = "1 High Street",
                Latitude = 51.5,
                Longitude = -0.12
            });

            Assert.False(updated.Success);
        }

        [Fact]
        public async Task DeleteJob_removes_job_and_its_quotes_but_not_booked_jobs()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobs = new JobsService(db);
            var quotes = new QuoteService(db);

            var created = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());
            await quotes.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = created.Data.JobId,
                Price = 100m,
                Description = "quote"
            });

            var deleted = await jobs.DeleteJobAsync(customerUserId.ToString(), created.Data.JobId);
            Assert.True(deleted.Success);
            Assert.Empty(db.Jobs);
            Assert.Empty(db.Quotes);

            // Booked jobs cannot be deleted.
            var second = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());
            var job = db.Jobs.Single();
            job.Status = JobStatusEnum.Accepted;
            db.SaveChanges();

            var blocked = await jobs.DeleteJobAsync(customerUserId.ToString(), second.Data.JobId);
            Assert.False(blocked.Success);
            Assert.Single(db.Jobs);
        }

        [Fact]
        public async Task CompleteJob_only_allowed_when_booked()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, _) = Seed(db);
            var jobs = new JobsService(db);
            var created = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());

            var tooEarly = await jobs.CompleteJobAsync(customerUserId.ToString(), created.Data.JobId);
            Assert.False(tooEarly.Success);

            var job = db.Jobs.Single();
            job.Status = JobStatusEnum.Accepted;
            db.SaveChanges();

            var completed = await jobs.CompleteJobAsync(customerUserId.ToString(), created.Data.JobId);
            Assert.True(completed.Success);
            Assert.Equal(JobStatusEnum.Completed, db.Jobs.Single().Status);
        }

        [Fact]
        public async Task Quote_update_and_withdraw_blocked_once_booked()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobs = new JobsService(db);
            var quotes = new QuoteService(db);

            var job = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());
            var quote = await quotes.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = job.Data.JobId,
                Price = 100m,
                Description = "quote"
            });

            var updated = await quotes.UpdateQuoteAsync(professionalUserId.ToString(), quote.Data.QuoteId, new UpdateQuoteDTO
            {
                Price = 120m,
                Description = "better quote"
            });
            Assert.True(updated.Success);
            Assert.Equal(120m, db.Quotes.Single().Price);

            // Book the job with this quote.
            var entity = db.Jobs.Single();
            entity.Status = JobStatusEnum.Accepted;
            entity.AcceptedQuoteId = Guid.Parse(quote.Data.QuoteId);
            db.SaveChanges();

            var blockedUpdate = await quotes.UpdateQuoteAsync(professionalUserId.ToString(), quote.Data.QuoteId, new UpdateQuoteDTO
            {
                Price = 50m,
                Description = "sneaky discount"
            });
            Assert.False(blockedUpdate.Success);

            var blockedWithdraw = await quotes.WithdrawQuoteAsync(professionalUserId.ToString(), quote.Data.QuoteId);
            Assert.False(blockedWithdraw.Success);
            Assert.Single(db.Quotes);
        }

        [Fact]
        public async Task Directory_filters_by_area_specialty_and_price()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var jobs = new JobsService(db);
            var quotes = new QuoteService(db);
            var directory = new ProfessionalsService(db);

            var job = await jobs.CreateJobAsync(customerUserId.ToString(), ValidJob());
            await quotes.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = job.Data.JobId,
                Price = 80m,
                Description = "quote"
            });

            var all = await directory.GetDirectoryAsync("", "", "", null);
            Assert.True(all.Success);
            var item = Assert.Single(all.Data);
            Assert.Equal(1, item.QuoteCount);
            Assert.Equal(80m, item.AverageQuotePrice);

            var byArea = await directory.GetDirectoryAsync("", "", "leeds", null);
            Assert.Single(byArea.Data);

            var wrongArea = await directory.GetDirectoryAsync("", "", "manchester", null);
            Assert.Empty(wrongArea.Data);

            var bySpecialty = await directory.GetDirectoryAsync("", "plumb", "", null);
            Assert.Single(bySpecialty.Data);

            var underBudget = await directory.GetDirectoryAsync("", "", "", 100m);
            Assert.Single(underBudget.Data);

            var overBudget = await directory.GetDirectoryAsync("", "", "", 50m);
            Assert.Empty(overBudget.Data);
        }
    }
}
