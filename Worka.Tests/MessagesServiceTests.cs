using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;
using Worka.Services.Enums;
using Worka.Services.Jobs;
using Worka.Services.Messages;
using Worka.Services.Quotes;
using Xunit;

namespace Worka.Tests
{
    public class MessagesServiceTests
    {
        private static (Guid customerUserId, Guid professionalUserId, Guid strangerUserId) Seed(
            Services.Database.WorkaDbContext db)
        {
            var customerUser = new User(
                "Cara", "Customer", "cara@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Customer, DateTimeOffset.UtcNow);
            var professionalUser = new User(
                "Paul", "Pro", "paul@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Professional, DateTimeOffset.UtcNow);
            var strangerUser = new User(
                "Sam", "Stranger", "sam@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Customer, DateTimeOffset.UtcNow);
            db.Users.AddRange(customerUser, professionalUser, strangerUser);
            db.SaveChanges();

            db.Customers.Add(new Customer { UserId = customerUser.UserId, FirstName = "Cara", LastName = "Customer", Email = "cara@example.com" });
            db.Customers.Add(new Customer { UserId = strangerUser.UserId, FirstName = "Sam", LastName = "Stranger", Email = "sam@example.com" });
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
            return (customerUser.UserId, professionalUser.UserId, strangerUser.UserId);
        }

        private static async Task<string> CreateJob(Services.Database.WorkaDbContext db, Guid customerUserId)
        {
            var jobs = new JobsService(db);
            var job = await jobs.CreateJobAsync(customerUserId.ToString(), new CreateJobDTO
            {
                JobName = "Fix tap",
                JobDescription = "Dripping",
                Category = "Plumbing",
                Address = "1 High Street",
                Latitude = 51.5,
                Longitude = -0.12
            });
            return job.Data.JobId;
        }

        [Fact]
        public async Task Thread_redacts_contact_details_until_booked()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId, _) = Seed(db);
            var jobId = await CreateJob(db, customerUserId);
            var professionalId = db.Professionals.Single().ProfessionalId.ToString();
            var messages = new MessagesService(db);

            var sent = await messages.SendAsync(
                professionalUserId.ToString(), jobId, professionalId,
                "Call me on 07911 123456 or email paul@example.com to sort it faster.");
            Assert.True(sent.Success);

            // Pre-booking: the customer reads a redacted thread.
            var thread = await messages.GetThreadAsync(customerUserId.ToString(), jobId, professionalId);
            Assert.True(thread.Success);
            var message = Assert.Single(thread.Data);
            Assert.Equal("professional", message.SenderRole);
            Assert.DoesNotContain("07911", message.Body);
            Assert.DoesNotContain("paul@example.com", message.Body);
            Assert.Contains("[hidden until booked]", message.Body);

            // The database keeps the original body so booking unlocks it.
            Assert.Contains("07911 123456", db.JobMessages.Single().Body);

            // Book the job with this professional's quote.
            var quote = await new QuoteService(db).CreateQuoteAsync(professionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = jobId,
                Price = 100m,
                Description = "quote"
            });
            var job = db.Jobs.Single();
            job.Status = JobStatusEnum.Accepted;
            job.AcceptedQuoteId = Guid.Parse(quote.Data.QuoteId);
            db.SaveChanges();

            var unlocked = await messages.GetThreadAsync(customerUserId.ToString(), jobId, professionalId);
            Assert.True(unlocked.Success);
            var unlockedMessage = Assert.Single(unlocked.Data);
            Assert.Contains("07911 123456", unlockedMessage.Body);
            Assert.Contains("paul@example.com", unlockedMessage.Body);
        }

        [Fact]
        public async Task Inbox_lists_threads_newest_first_with_redacted_preview_and_unread_counts()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId, _) = Seed(db);
            var jobId = await CreateJob(db, customerUserId);
            var professionalId = db.Professionals.Single().ProfessionalId.ToString();
            var messages = new MessagesService(db);

            await messages.SendAsync(professionalUserId.ToString(), jobId, professionalId,
                "Happy to help - reach me on 07911 123456.");

            // The customer's inbox shows the pro as the counterpart, the preview
            // redacted (not booked), and one unread from the professional.
            var customerInbox = await messages.ListConversationsAsync(customerUserId.ToString());
            Assert.True(customerInbox.Success);
            var customerThread = Assert.Single(customerInbox.Data);
            Assert.Equal(jobId, customerThread.JobId);
            Assert.Equal("customer", customerThread.Role);
            Assert.Equal("Paul Pro", customerThread.CounterpartName);
            Assert.Equal("professional", customerThread.LastSenderRole);
            Assert.DoesNotContain("07911", customerThread.LastMessageBody);
            Assert.False(customerThread.Booked);
            Assert.Equal(1, customerThread.UnreadCount);

            // The professional's own message is not unread to them.
            var proInbox = await messages.ListConversationsAsync(professionalUserId.ToString());
            var proThread = Assert.Single(proInbox.Data);
            Assert.Equal("professional", proThread.Role);
            Assert.Equal("Cara Customer", proThread.CounterpartName);
            Assert.Equal(0, proThread.UnreadCount);

            // Marking the thread read clears the customer's unread count.
            var marked = await messages.MarkReadAsync(customerUserId.ToString(), jobId, professionalId);
            Assert.True(marked.Success);
            var afterRead = await messages.ListConversationsAsync(customerUserId.ToString());
            Assert.Equal(0, Assert.Single(afterRead.Data).UnreadCount);

            // A new reply from the pro makes it unread again.
            await messages.SendAsync(professionalUserId.ToString(), jobId, professionalId, "Any update?");
            var afterReply = await messages.ListConversationsAsync(customerUserId.ToString());
            Assert.Equal(1, Assert.Single(afterReply.Data).UnreadCount);
        }

        [Fact]
        public async Task Inbox_is_empty_and_strangers_cannot_mark_read()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId, strangerUserId) = Seed(db);
            var jobId = await CreateJob(db, customerUserId);
            var professionalId = db.Professionals.Single().ProfessionalId.ToString();
            var messages = new MessagesService(db);

            // No messages yet: everyone's inbox is empty.
            var empty = await messages.ListConversationsAsync(customerUserId.ToString());
            Assert.True(empty.Success);
            Assert.Empty(empty.Data);

            await messages.SendAsync(professionalUserId.ToString(), jobId, professionalId, "Hello");

            // A non-participant sees nothing and cannot mark the thread read.
            var strangerInbox = await messages.ListConversationsAsync(strangerUserId.ToString());
            Assert.Empty(strangerInbox.Data);
            var strangerMark = await messages.MarkReadAsync(strangerUserId.ToString(), jobId, professionalId);
            Assert.False(strangerMark.Success);
        }

        [Fact]
        public async Task Only_participants_can_read_or_write_the_thread()
        {
            using var db = TestHelpers.CreateDbContext();
            var (customerUserId, professionalUserId, strangerUserId) = Seed(db);
            var jobId = await CreateJob(db, customerUserId);
            var professionalId = db.Professionals.Single().ProfessionalId.ToString();
            var messages = new MessagesService(db);

            await messages.SendAsync(professionalUserId.ToString(), jobId, professionalId, "When could I view the tap?");

            // A customer who does not own the job is turned away.
            var strangerRead = await messages.GetThreadAsync(strangerUserId.ToString(), jobId, professionalId);
            Assert.False(strangerRead.Success);
            Assert.Equal("Not part of this conversation.", strangerRead.Message);

            var strangerWrite = await messages.SendAsync(strangerUserId.ToString(), jobId, professionalId, "Let me in");
            Assert.False(strangerWrite.Success);

            // The job owner must say which professional's thread they want.
            var missingProfessional = await messages.GetThreadAsync(customerUserId.ToString(), jobId);
            Assert.False(missingProfessional.Success);

            // Empty messages are rejected.
            var empty = await messages.SendAsync(customerUserId.ToString(), jobId, professionalId, "   ");
            Assert.False(empty.Success);

            // The participants themselves are fine.
            var customerRead = await messages.GetThreadAsync(customerUserId.ToString(), jobId, professionalId);
            Assert.True(customerRead.Success);
            Assert.Single(customerRead.Data);

            var professionalRead = await messages.GetThreadAsync(professionalUserId.ToString(), jobId);
            Assert.True(professionalRead.Success);
            Assert.Single(professionalRead.Data);
        }
    }
}
