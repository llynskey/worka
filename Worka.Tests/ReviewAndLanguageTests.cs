using Worka.Services.Customers;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;
using Worka.Services.DTOs.Reviews;
using Worka.Services.Enums;
using Worka.Services.Jobs;
using Worka.Services.Professionals;
using Worka.Services.Quotes;
using Worka.Services.Reviews;
using Xunit;

namespace Worka.Tests
{
    public class ReviewAndLanguageTests
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
            db.Professionals.Add(new Professional
            {
                UserId = professionalUser.UserId,
                FirstName = "Paul",
                LastName = "Pro",
                Email = "paul@example.com",
                ServiceArea = "Leeds",
                Specialty = "Plumbing",
                Languages = "en,pl"
            });
            db.SaveChanges();
            return (customerUser.UserId, professionalUser.UserId);
        }

        private static async Task<(string jobId, string quoteId)> BookJob(
            Services.Database.WorkaDbContext db, Guid customerUserId, Guid professionalUserId)
        {
            var jobs = new JobsService(db);
            var quotes = new QuoteService(db);
            var job = await jobs.CreateJobAsync(customerUserId.ToString(), new CreateJobDTO
            {
                JobName = "Fix tap",
                JobDescription = "Dripping",
                Category = "Plumbing",
                Address = "1 High Street",
                Latitude = 51.5,
                Longitude = -0.12
            });
            var quote = await quotes.CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = job.Data.JobId,
                Price = 100m,
                Description = "quote"
            });

            var entity = db.Jobs.Single();
            entity.Status = JobStatusEnum.Accepted;
            entity.AcceptedQuoteId = Guid.Parse(quote.Data.QuoteId);
            db.SaveChanges();
            return (job.Data.JobId, quote.Data.QuoteId);
        }

        [Fact]
        public async Task Review_requires_completed_job_and_is_single_use()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var (jobId, _) = await BookJob(db, customerUserId, professionalUserId);
            var reviews = new ReviewsService(db);

            var tooEarly = await reviews.CreateReviewAsync(customerUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 5,
                Comment = "Great"
            });
            Assert.False(tooEarly.Success);

            var job = db.Jobs.Single();
            job.Status = JobStatusEnum.Completed;
            db.SaveChanges();

            var badRating = await reviews.CreateReviewAsync(customerUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 6,
                Comment = "Too many stars"
            });
            Assert.False(badRating.Success);

            var ok = await reviews.CreateReviewAsync(customerUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 5,
                Comment = "Great work"
            });
            Assert.True(ok.Success);
            Assert.Single(db.Reviews);

            var duplicate = await reviews.CreateReviewAsync(customerUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 1,
                Comment = "Changed my mind"
            });
            Assert.False(duplicate.Success);
            Assert.Single(db.Reviews);

            // Non-owner cannot review.
            var stranger = await reviews.CreateReviewAsync(professionalUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 5,
                Comment = "Reviewing myself"
            });
            Assert.False(stranger.Success);
        }

        [Fact]
        public async Task Directory_filters_by_language_and_includes_ratings()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId) = Seed(db);
            var (jobId, _) = await BookJob(db, customerUserId, professionalUserId);
            db.Jobs.Single().Status = JobStatusEnum.Completed;
            db.SaveChanges();

            await new ReviewsService(db).CreateReviewAsync(customerUserId.ToString(), jobId, new CreateReviewDTO
            {
                Rating = 4,
                Comment = "Solid"
            });

            var directory = new ProfessionalsService(db);

            var polish = await directory.GetDirectoryAsync("", "", "", null, "pl");
            var item = Assert.Single(polish.Data);
            Assert.Equal(4, item.AverageRating);
            Assert.Equal(1, item.ReviewCount);

            var french = await directory.GetDirectoryAsync("", "", "", null, "fr");
            Assert.Empty(french.Data);
        }

        [Fact]
        public async Task Professional_can_save_a_work_location()
        {
            using var db = TestHelpers.CreateDbContext();
            var (_, professionalUserId) = Seed(db);
            var service = new ProfessionalsService(db);
            var pro = db.Professionals.Single();

            var updated = await service.UpdateAsync(
                professionalUserId.ToString(),
                pro.FirstName, pro.LastName, pro.Email, pro.Specialty, pro.Bio, pro.ServiceArea,
                latitude: 53.8008, longitude: -1.5491, locationLabel: "Leeds, UK");

            Assert.True(updated.Success);
            Assert.Equal(53.8008, updated.Data.Latitude);
            Assert.Equal(-1.5491, updated.Data.Longitude);
            Assert.Equal("Leeds, UK", updated.Data.LocationLabel);
            Assert.Equal(53.8008, db.Professionals.Single().Latitude);
        }

        [Theory]
        [InlineData("EN, pl,  es", "en,pl,es")]
        [InlineData("en,en,en", "en")]
        [InlineData("x,, en", "en")]
        [InlineData("", "")]
        public void Language_lists_are_normalized(string input, string expected)
        {
            Assert.Equal(expected, CustomersService.NormalizeLanguages(input));
        }
    }
}
