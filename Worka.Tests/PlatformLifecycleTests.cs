using Microsoft.EntityFrameworkCore;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;
using Worka.Services.Dev;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;
using Worka.Services.DTOs.Reviews;
using Worka.Services.Enums;
using Worka.Services.Favourites;
using Worka.Services.Jobs;
using Worka.Services.Notifications;
using Worka.Services.Payments;
using Worka.Services.Quotes;
using Worka.Services.Reviews;
using Xunit;

namespace Worka.Tests
{
    /// <summary>
    /// End-to-end business-logic tests for the marketplace lifecycle:
    /// job -> quote (with proposed time) -> booking -> schedule handshake ->
    /// completion -> review -> earnings/receipts -> cancellation/refund,
    /// plus notifications (in-app + email mirror), favourites, invites and
    /// the dev sample-data seed. Booking-by-payment is simulated the same way
    /// the Stripe webhook applies it (the webhook's signature check itself
    /// needs Stripe and is exercised in test mode against the live dashboard).
    /// </summary>
    public class PlatformLifecycleTests
    {
        private sealed class World
        {
            public Services.Database.WorkaDbContext Db { get; init; }
            public FakeEmailService Email { get; init; }
            public NotificationsService Notifications { get; init; }
            public JobsService Jobs { get; init; }
            public QuoteService Quotes { get; init; }
            public ReviewsService Reviews { get; init; }
            public PaymentsService Payments { get; init; }
            public FavouritesService Favourites { get; init; }
            public DevSeedService Seed { get; init; }
            public Guid CustomerUserId { get; init; }
            public Guid ProfessionalUserId { get; init; }
            public Guid StrangerUserId { get; init; }
        }

        private static World CreateWorld()
        {
            var db = TestHelpers.CreateDbContext();

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

            db.Customers.Add(new Customer
            {
                UserId = customerUser.UserId,
                FirstName = "Cara",
                LastName = "Customer",
                Email = "cara@example.com",
            });
            db.Customers.Add(new Customer
            {
                UserId = strangerUser.UserId,
                FirstName = "Sam",
                LastName = "Stranger",
                Email = "sam@example.com",
            });
            db.Professionals.Add(new Professional
            {
                UserId = professionalUser.UserId,
                FirstName = "Paul",
                LastName = "Pro",
                Email = "paul@example.com",
                ServiceArea = "Leeds",
                Specialty = "Plumbing",
                Languages = "en",
            });
            db.SaveChanges();

            var email = new FakeEmailService();
            var notifications = new NotificationsService(db, email);

            return new World
            {
                Db = db,
                Email = email,
                Notifications = notifications,
                Jobs = new JobsService(db, notifications),
                Quotes = new QuoteService(db, notifications),
                Reviews = new ReviewsService(db, notifications),
                Payments = new PaymentsService(db, TestHelpers.CreateConfiguration(), notifications),
                Favourites = new FavouritesService(db),
                Seed = new DevSeedService(db),
                CustomerUserId = customerUser.UserId,
                ProfessionalUserId = professionalUser.UserId,
                StrangerUserId = strangerUser.UserId,
            };
        }

        private static async Task<(Guid JobId, Guid QuoteId)> CreateJobWithQuote(
            World world, DateTimeOffset? proposedTime = null)
        {
            var job = await world.Jobs.CreateJobAsync(world.CustomerUserId.ToString(), new CreateJobDTO
            {
                JobName = "Fix leaking tap",
                JobDescription = "Kitchen mixer drips",
                Category = "Plumbing",
                Address = "1 High Street",
                Latitude = 51.5,
                Longitude = -0.12,
            });
            Assert.True(job.Success, job.Message);

            var quote = await world.Quotes.CreateQuoteAsync(world.ProfessionalUserId.ToString(), new CreateQuoteDTO
            {
                JobId = job.Data.JobId,
                Price = 120m,
                Description = "Replace cartridge",
                ScheduledAt = proposedTime,
            });
            Assert.True(quote.Success, quote.Message);

            return (Guid.Parse(job.Data.JobId), Guid.Parse(quote.Data.QuoteId));
        }

        /// <summary>Applies exactly what the paid-webhook does to book a job.</summary>
        private static async Task<WorkaPayment> BookViaPaidPayment(World world, Guid jobId, Guid quoteId)
        {
            var job = await world.Db.Jobs.FirstAsync(j => j.JobId == jobId);
            var quote = await world.Db.Quotes.FirstAsync(q => q.QuoteId == quoteId);
            var customer = await world.Db.Customers.FirstAsync(c => c.CustomerId == job.CustomerId);

            var payment = new WorkaPayment
            {
                JobId = jobId,
                QuoteId = quoteId,
                CustomerId = job.CustomerId,
                ProfessionalId = quote.ProfessionalId,
                StripeCheckoutSessionId = $"test_{Guid.NewGuid():N}",
                StripePaymentIntentId = string.Empty, // no Stripe in tests -> simulated refund path
                QuoteAmount = quote.Price,
                ServiceFeeAmount = 12m,
                TotalAmount = quote.Price + 12m,
                WorkerAmount = quote.Price,
                Currency = "gbp",
                Status = "paid",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            world.Db.WorkaPayments.Add(payment);

            job.AcceptedQuoteId = quoteId;
            job.Status = JobStatusEnum.Accepted;
            if (quote.ScheduledAt != null)
            {
                job.ScheduledAt = quote.ScheduledAt;
                job.ScheduleConfirmed = false;
            }
            job.UpdatedAt = DateTimeOffset.UtcNow;
            await world.Db.SaveChangesAsync();

            Assert.NotNull(customer);
            return payment;
        }

        [Fact]
        public async Task NewQuote_NotifiesCustomer_InAppAndByEmail()
        {
            var world = CreateWorld();
            await CreateJobWithQuote(world);

            var list = await world.Notifications.GetForUserAsync(world.CustomerUserId.ToString());
            Assert.True(list.Success);
            var quoteNotification = Assert.Single(list.Data, n => n.Type == "quote");
            Assert.False(quoteNotification.Read);

            Assert.Contains(world.Email.Sent, m => m.To == "cara@example.com" && m.Subject.Contains("quote"));
        }

        [Fact]
        public async Task ProposedTime_TravelsFromQuote_ToBooking()
        {
            var world = CreateWorld();
            var when = DateTimeOffset.UtcNow.AddDays(3);
            var (jobId, quoteId) = await CreateJobWithQuote(world, when);

            await BookViaPaidPayment(world, jobId, quoteId);

            var job = await world.Db.Jobs.AsNoTracking().FirstAsync(j => j.JobId == jobId);
            Assert.Equal(when, job.ScheduledAt);
            Assert.False(job.ScheduleConfirmed);
        }

        [Fact]
        public async Task Schedule_ProposeAndConfirm_NotifyTheOtherParty()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world, DateTimeOffset.UtcNow.AddDays(2));
            await BookViaPaidPayment(world, jobId, quoteId);

            // The pro proposes a new time -> customer is notified, confirmation resets.
            var newTime = DateTimeOffset.UtcNow.AddDays(5);
            var proposed = await world.Jobs.SetScheduleAsync(world.ProfessionalUserId.ToString(), jobId.ToString(), newTime);
            Assert.True(proposed.Success, proposed.Message);
            Assert.False(proposed.Data.ScheduleConfirmed);

            var customerNotifications = await world.Notifications.GetForUserAsync(world.CustomerUserId.ToString());
            Assert.Contains(customerNotifications.Data, n => n.Type == "booking" && n.Title.Contains("time", StringComparison.OrdinalIgnoreCase));

            // The customer confirms -> pro is notified, schedule locked.
            var confirmed = await world.Jobs.ConfirmScheduleAsync(world.CustomerUserId.ToString(), jobId.ToString());
            Assert.True(confirmed.Success, confirmed.Message);
            Assert.True(confirmed.Data.ScheduleConfirmed);

            var proNotifications = await world.Notifications.GetForUserAsync(world.ProfessionalUserId.ToString());
            Assert.Contains(proNotifications.Data, n => n.Type == "booking" && n.Title.Contains("confirmed", StringComparison.OrdinalIgnoreCase));
        }

        [Fact]
        public async Task Schedule_RejectsOutsiders_AndUnbookedJobs()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);

            // Not booked yet -> cannot schedule.
            var early = await world.Jobs.SetScheduleAsync(world.CustomerUserId.ToString(), jobId.ToString(), DateTimeOffset.UtcNow.AddDays(1));
            Assert.False(early.Success);

            await BookViaPaidPayment(world, jobId, quoteId);

            // A third party may not touch the booking.
            var outsider = await world.Jobs.SetScheduleAsync(world.StrangerUserId.ToString(), jobId.ToString(), DateTimeOffset.UtcNow.AddDays(1));
            Assert.False(outsider.Success);
        }

        [Fact]
        public async Task Complete_Review_And_Notifications_FlowThrough()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);
            await BookViaPaidPayment(world, jobId, quoteId);

            var completed = await world.Jobs.CompleteJobAsync(world.CustomerUserId.ToString(), jobId.ToString());
            Assert.True(completed.Success, completed.Message);
            Assert.Equal(JobStatusEnum.Completed, completed.Data.JobStatus);

            var review = await world.Reviews.CreateReviewAsync(world.CustomerUserId.ToString(), jobId.ToString(), new CreateReviewDTO
            {
                Rating = 5,
                Comment = "Great work",
            });
            Assert.True(review.Success, review.Message);

            var proNotifications = await world.Notifications.GetForUserAsync(world.ProfessionalUserId.ToString());
            Assert.Contains(proNotifications.Data, n => n.Type == "completed");
            Assert.Contains(proNotifications.Data, n => n.Type == "review");
            Assert.Contains(world.Email.Sent, m => m.To == "paul@example.com");
        }

        [Fact]
        public async Task Earnings_And_CustomerHistory_ReportPaidBookings()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);
            await BookViaPaidPayment(world, jobId, quoteId);

            var earnings = await world.Payments.GetEarningsForProfessionalAsync(world.ProfessionalUserId.ToString());
            Assert.True(earnings.Success, earnings.Message);
            Assert.Equal(120m, earnings.Data.TotalEarned);
            Assert.Equal(1, earnings.Data.BookingsCount);
            var line = Assert.Single(earnings.Data.Payments);
            Assert.Equal("Fix leaking tap", line.JobName);
            Assert.Contains("Cara", line.CounterpartName);

            var history = await world.Payments.GetPaymentHistoryForCustomerAsync(world.CustomerUserId.ToString());
            Assert.True(history.Success, history.Message);
            Assert.Equal(132m, history.Data.TotalSpent);
            Assert.Equal(1, history.Data.PaymentsCount);
        }

        [Fact]
        public async Task CancelBooking_SimulatedRefund_UpdatesEverything_AndNotifies()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);
            var payment = await BookViaPaidPayment(world, jobId, quoteId);

            var cancelled = await world.Payments.CancelBookingAsync(world.CustomerUserId.ToString(), jobId.ToString());
            Assert.True(cancelled.Success, cancelled.Message);

            var job = await world.Db.Jobs.AsNoTracking().FirstAsync(j => j.JobId == jobId);
            Assert.Equal(JobStatusEnum.Cancelled, job.Status);

            var storedPayment = await world.Db.WorkaPayments.AsNoTracking().FirstAsync(p => p.PaymentId == payment.PaymentId);
            Assert.Equal("refunded", storedPayment.Status);

            var proNotifications = await world.Notifications.GetForUserAsync(world.ProfessionalUserId.ToString());
            Assert.Contains(proNotifications.Data, n => n.Type == "booking" && n.Title.Contains("cancelled", StringComparison.OrdinalIgnoreCase));
        }

        [Fact]
        public async Task CancelBooking_RejectsOutsiders_AndUnbookedJobs()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);

            var early = await world.Payments.CancelBookingAsync(world.CustomerUserId.ToString(), jobId.ToString());
            Assert.False(early.Success);

            await BookViaPaidPayment(world, jobId, quoteId);

            var outsider = await world.Payments.CancelBookingAsync(world.StrangerUserId.ToString(), jobId.ToString());
            Assert.False(outsider.Success);
        }

        [Fact]
        public async Task Favourites_ToggleOnAndOff()
        {
            var world = CreateWorld();
            var professionalId = (await world.Db.Professionals.FirstAsync()).ProfessionalId.ToString();

            var on = await world.Favourites.ToggleAsync(world.CustomerUserId.ToString(), professionalId);
            Assert.True(on.Success);
            Assert.True(on.Data);

            var list = await world.Favourites.GetForCustomerAsync(world.CustomerUserId.ToString());
            Assert.Equal(professionalId, Assert.Single(list.Data));

            var off = await world.Favourites.ToggleAsync(world.CustomerUserId.ToString(), professionalId);
            Assert.False(off.Data);
            Assert.Empty((await world.Favourites.GetForCustomerAsync(world.CustomerUserId.ToString())).Data);
        }

        [Fact]
        public async Task Invite_NotifiesPro_AndEnforcesGuards()
        {
            var world = CreateWorld();
            var (jobId, quoteId) = await CreateJobWithQuote(world);
            var professionalId = (await world.Db.Professionals.FirstAsync()).ProfessionalId.ToString();

            // Stranger does not own the job.
            var notOwner = await world.Jobs.InviteProfessionalAsync(world.StrangerUserId.ToString(), jobId.ToString(), professionalId);
            Assert.False(notOwner.Success);

            var invited = await world.Jobs.InviteProfessionalAsync(world.CustomerUserId.ToString(), jobId.ToString(), professionalId);
            Assert.True(invited.Success, invited.Message);

            var proNotifications = await world.Notifications.GetForUserAsync(world.ProfessionalUserId.ToString());
            Assert.Contains(proNotifications.Data, n => n.Type == "quote" && n.Title.Contains("invited", StringComparison.OrdinalIgnoreCase));

            // Once booked, inviting is closed.
            await BookViaPaidPayment(world, jobId, quoteId);
            var late = await world.Jobs.InviteProfessionalAsync(world.CustomerUserId.ToString(), jobId.ToString(), professionalId);
            Assert.False(late.Success);
        }

        [Fact]
        public async Task Notifications_UnreadCount_MarkRead_And_MarkAll()
        {
            var world = CreateWorld();
            await CreateJobWithQuote(world); // quote notification
            var professionalId = (await world.Db.Professionals.FirstAsync()).ProfessionalId.ToString();
            var jobs = await world.Db.Jobs.AsNoTracking().ToListAsync();
            await world.Jobs.InviteProfessionalAsync(world.CustomerUserId.ToString(), jobs[0].JobId.ToString(), professionalId);

            var customerId = world.CustomerUserId.ToString();
            var unread = await world.Notifications.GetUnreadCountAsync(customerId);
            Assert.Equal(1, unread.Data); // the quote notification

            var list = await world.Notifications.GetForUserAsync(customerId);
            var markOne = await world.Notifications.MarkReadAsync(customerId, list.Data[0].NotificationId);
            Assert.True(markOne.Success);
            Assert.Equal(0, (await world.Notifications.GetUnreadCountAsync(customerId)).Data);

            // The pro has an invite notification; mark-all clears it.
            var proId = world.ProfessionalUserId.ToString();
            Assert.True((await world.Notifications.GetUnreadCountAsync(proId)).Data > 0);
            await world.Notifications.MarkAllReadAsync(proId);
            Assert.Equal(0, (await world.Notifications.GetUnreadCountAsync(proId)).Data);

            // Users can only mark their own notifications.
            var foreign = await world.Notifications.MarkReadAsync(proId, list.Data[0].NotificationId);
            Assert.False(foreign.Success);
        }

        [Fact]
        public async Task QuoteEdit_KeepsProposedTime_WhenNoneSupplied()
        {
            var world = CreateWorld();
            var when = DateTimeOffset.UtcNow.AddDays(4);
            var (_, quoteId) = await CreateJobWithQuote(world, when);

            var updated = await world.Quotes.UpdateQuoteAsync(world.ProfessionalUserId.ToString(), quoteId.ToString(), new UpdateQuoteDTO
            {
                Price = 140m,
                Description = "Updated scope",
                ScheduledAt = null, // surfaces that don't send the field must not wipe it
            });
            Assert.True(updated.Success, updated.Message);
            Assert.Equal(when, updated.Data.ScheduledAt);
            Assert.Equal(140m, updated.Data.Price);
        }

        [Fact]
        public async Task Directory_HidesIncompleteProfiles_LikeAccidentalModeSwitchers()
        {
            var world = CreateWorld();

            // A customer who merely toggled to professional mode gets an empty
            // profile row — it must never appear in the directory.
            var switcher = new User(
                "Curious", "Customer", "curious@example.com",
                new byte[32], new byte[16], AccountTypeEnum.Customer, DateTimeOffset.UtcNow);
            world.Db.Users.Add(switcher);
            world.Db.Professionals.Add(new Professional
            {
                UserId = switcher.UserId,
                FirstName = "Curious",
                LastName = "Customer",
                Email = "curious@example.com",
                Specialty = string.Empty,
                ServiceArea = string.Empty,
            });
            await world.Db.SaveChangesAsync();

            var directory = new Services.Professionals.ProfessionalsService(world.Db);
            var result = await directory.GetDirectoryAsync(null, null, null, null);
            Assert.True(result.Success, result.Message);

            // Only the complete profile (Paul, Plumbing/Leeds) is listed.
            var listed = Assert.Single(result.Data);
            Assert.Equal("Paul", listed.FirstName);
        }

        [Fact]
        public async Task DevSeed_CreatesTestableWorld_AndReseedsIdempotently()
        {
            var world = CreateWorld();
            var userId = world.CustomerUserId.ToString();

            var first = await world.Seed.SeedForUserAsync(userId);
            Assert.True(first.Success, first.Message);

            var sampleJobs = await world.Db.Jobs.AsNoTracking().Where(j => j.Name.StartsWith("[Sample]")).ToListAsync();
            Assert.Equal(3, sampleJobs.Count);
            Assert.Contains(sampleJobs, j => j.Status == JobStatusEnum.Pending);
            Assert.Contains(sampleJobs, j => j.Status == JobStatusEnum.Accepted);
            Assert.Contains(sampleJobs, j => j.Status == JobStatusEnum.Completed);

            // The booked sample can be cancelled with a simulated refund.
            var booked = sampleJobs.First(j => j.Status == JobStatusEnum.Accepted);
            var cancelled = await world.Payments.CancelBookingAsync(userId, booked.JobId.ToString());
            Assert.True(cancelled.Success, cancelled.Message);

            // Re-seeding replaces the samples instead of duplicating them.
            var second = await world.Seed.SeedForUserAsync(userId);
            Assert.True(second.Success, second.Message);
            var afterReseed = await world.Db.Jobs.AsNoTracking().CountAsync(j => j.Name.StartsWith("[Sample]"));
            Assert.Equal(3, afterReseed);
        }
    }
}
