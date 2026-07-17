using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Messages;
using Worka.Services.Notifications;

namespace Worka.Services.Messages
{
    /// <summary>
    /// Per-(job, professional) chat so professionals can clarify scope before
    /// quoting. Message bodies are stored as written but contact details are
    /// redacted on read until the job is booked with that professional, at
    /// which point the full history unlocks.
    /// </summary>
    public class MessagesService : IMessagesService
    {
        private const int MaxBodyLength = 2000;

        private readonly WorkaDbContext _dbContext;
        private readonly INotificationsService _notifications;

        public MessagesService(WorkaDbContext dbContext, INotificationsService notifications = null)
        {
            _dbContext = dbContext;
            _notifications = notifications;
        }

        public async Task<WorkaResponse<List<JobMessageDTO>>> GetThreadAsync(
            string userId, string jobId, string professionalId = null)
        {
            try
            {
                var (thread, error) = await ResolveThreadAsync(userId, jobId, professionalId);
                if (error != null)
                {
                    return new WorkaResponse<List<JobMessageDTO>>(error);
                }

                var messages = await _dbContext.JobMessages
                    .Where(m => m.JobId == thread.Job.JobId && m.ProfessionalId == thread.Professional.ProfessionalId)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                var booked = await IsBookedWithProfessionalAsync(thread.Job, thread.Professional.ProfessionalId);

                var items = messages
                    .Select(m => new JobMessageDTO(
                        m,
                        m.SenderUserId == thread.Professional.UserId ? "professional" : "customer",
                        booked ? m.Body : ContactRedaction.Redact(m.Body)))
                    .ToList();

                return new WorkaResponse<List<JobMessageDTO>>(items);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<JobMessageDTO>>.Fail(ex, "An error occurred while loading messages.");
            }
        }

        public async Task<WorkaResponse<JobMessageDTO>> SendAsync(
            string userId, string jobId, string professionalId, string body)
        {
            try
            {
                var trimmed = (body ?? string.Empty).Trim();
                if (trimmed.Length == 0)
                {
                    return new WorkaResponse<JobMessageDTO>("Message cannot be empty.");
                }

                if (trimmed.Length > MaxBodyLength)
                {
                    return new WorkaResponse<JobMessageDTO>("Message is too long (2000 characters max).");
                }

                var (thread, error) = await ResolveThreadAsync(userId, jobId, professionalId);
                if (error != null)
                {
                    return new WorkaResponse<JobMessageDTO>(error);
                }

                // Store the original body: redaction happens on read so the
                // full history unlocks once the job is booked.
                var message = new JobMessage
                {
                    JobId = thread.Job.JobId,
                    ProfessionalId = thread.Professional.ProfessionalId,
                    SenderUserId = Guid.Parse(userId),
                    Body = trimmed,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _dbContext.JobMessages.Add(message);
                await _dbContext.SaveChangesAsync();

                // Notify the other side of the thread (generic — never include the
                // body, which may carry contact details redacted until booking).
                if (_notifications != null)
                {
                    var senderIsProfessional = message.SenderUserId == thread.Professional.UserId;
                    Guid recipientUserId;
                    if (senderIsProfessional)
                    {
                        var jobCustomer = await _dbContext.Customers
                            .FirstOrDefaultAsync(c => c.CustomerId == thread.Job.CustomerId);
                        recipientUserId = jobCustomer?.UserId ?? Guid.Empty;
                    }
                    else
                    {
                        recipientUserId = thread.Professional.UserId;
                    }

                    await _notifications.NotifyAsync(
                        recipientUserId,
                        "message",
                        "New message",
                        $"You have a new message about \"{thread.Job.Name}\".",
                        thread.Job.JobId);
                }

                var booked = await IsBookedWithProfessionalAsync(thread.Job, thread.Professional.ProfessionalId);

                return new WorkaResponse<JobMessageDTO>(new JobMessageDTO(
                    message,
                    message.SenderUserId == thread.Professional.UserId ? "professional" : "customer",
                    booked ? message.Body : ContactRedaction.Redact(message.Body)));
            }
            catch (Exception ex)
            {
                return WorkaResponse<JobMessageDTO>.Fail(ex, "An error occurred while sending the message.");
            }
        }

        /// <summary>
        /// The (job, professional) threads the caller takes part in for a single
        /// side of the marketplace, newest activity first, with a preview of the
        /// latest message and a count of what the other party has sent since the
        /// caller last read it. <paramref name="role"/> is the caller's active
        /// account type: a customer sees only threads on jobs they own, a
        /// professional only their own quotes/questions. This keeps the two
        /// inboxes separate for anyone who happens to hold both profiles.
        /// </summary>
        public async Task<WorkaResponse<List<ConversationSummaryDTO>>> ListConversationsAsync(string userId, string role)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<ConversationSummaryDTO>>("Invalid user identity.");
                }

                var empty = new WorkaResponse<List<ConversationSummaryDTO>>(new List<ConversationSummaryDTO>());
                var viewerIsProfessional = string.Equals(role, "professional", StringComparison.OrdinalIgnoreCase);

                var customer = viewerIsProfessional
                    ? null
                    : await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
                var professional = viewerIsProfessional
                    ? await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid)
                    : null;

                if (viewerIsProfessional ? professional == null : customer == null)
                {
                    return empty;
                }

                // Scope strictly to the active side so a user's professional
                // conversations never leak into their customer inbox and vice versa.
                var customerJobIds = customer == null
                    ? new List<Guid>()
                    : await _dbContext.Jobs
                        .Where(j => j.CustomerId == customer.CustomerId)
                        .Select(j => j.JobId)
                        .ToListAsync();

                var professionalId = professional?.ProfessionalId;

                // Pull the messages for this side, then group in memory so the
                // (job, professional) threading stays provider-agnostic.
                var messages = await _dbContext.JobMessages
                    .Where(m => customerJobIds.Contains(m.JobId)
                        || (professionalId != null && m.ProfessionalId == professionalId.Value))
                    .ToListAsync();

                if (messages.Count == 0)
                {
                    return new WorkaResponse<List<ConversationSummaryDTO>>(new List<ConversationSummaryDTO>());
                }

                var threads = messages
                    .GroupBy(m => new { m.JobId, m.ProfessionalId })
                    .ToList();

                var jobIds = threads.Select(t => t.Key.JobId).Distinct().ToList();
                var proIds = threads.Select(t => t.Key.ProfessionalId).Distinct().ToList();

                var jobs = await _dbContext.Jobs
                    .Where(j => jobIds.Contains(j.JobId))
                    .ToListAsync();
                var pros = await _dbContext.Professionals
                    .Where(p => proIds.Contains(p.ProfessionalId))
                    .ToListAsync();
                var jobCustomerIds = jobs.Select(j => j.CustomerId).Distinct().ToList();
                var jobCustomers = await _dbContext.Customers
                    .Where(c => jobCustomerIds.Contains(c.CustomerId))
                    .ToListAsync();
                var reads = await _dbContext.MessageReads
                    .Where(r => r.UserId == userGuid)
                    .ToListAsync();

                var summaries = new List<ConversationSummaryDTO>();

                foreach (var thread in threads)
                {
                    var job = jobs.FirstOrDefault(j => j.JobId == thread.Key.JobId);
                    var threadPro = pros.FirstOrDefault(p => p.ProfessionalId == thread.Key.ProfessionalId);
                    if (job == null || threadPro == null)
                    {
                        continue;
                    }

                    // The caller sees a thread on their own job as the customer;
                    // otherwise they are the professional on someone else's job.
                    var viewerIsCustomer = customer != null && job.CustomerId == customer.CustomerId;
                    var viewerRole = viewerIsCustomer ? "customer" : "professional";

                    var latest = thread.OrderByDescending(m => m.CreatedAt).First();
                    var booked = await IsBookedWithProfessionalAsync(job, threadPro.ProfessionalId);

                    var lastReadAt = reads
                        .FirstOrDefault(r => r.JobId == thread.Key.JobId && r.ProfessionalId == thread.Key.ProfessionalId)
                        ?.LastReadAt ?? DateTimeOffset.MinValue;

                    var unread = thread.Count(m => m.CreatedAt > lastReadAt && m.SenderUserId != userGuid);

                    string counterpartName;
                    string counterpartPhoto;
                    if (viewerIsCustomer)
                    {
                        counterpartName = $"{threadPro.FirstName} {threadPro.LastName}".Trim();
                        counterpartPhoto = threadPro.PhotoUrl;
                    }
                    else
                    {
                        var jobCustomer = jobCustomers.FirstOrDefault(c => c.CustomerId == job.CustomerId);
                        counterpartName = jobCustomer == null
                            ? string.Empty
                            : $"{jobCustomer.FirstName} {jobCustomer.LastName}".Trim();
                        counterpartPhoto = jobCustomer?.PhotoUrl ?? string.Empty;
                    }

                    summaries.Add(new ConversationSummaryDTO
                    {
                        JobId = job.JobId.ToString(),
                        JobName = job.Name,
                        ProfessionalId = threadPro.ProfessionalId.ToString(),
                        CounterpartName = counterpartName,
                        CounterpartPhotoUrl = counterpartPhoto,
                        Role = viewerRole,
                        LastMessageBody = booked ? latest.Body : ContactRedaction.Redact(latest.Body),
                        LastSenderRole = latest.SenderUserId == threadPro.UserId ? "professional" : "customer",
                        LastMessageAt = latest.CreatedAt,
                        UnreadCount = unread,
                        Booked = booked,
                    });
                }

                var ordered = summaries
                    .OrderByDescending(s => s.LastMessageAt)
                    .ToList();

                return new WorkaResponse<List<ConversationSummaryDTO>>(ordered);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<ConversationSummaryDTO>>.Fail(ex, "An error occurred while loading conversations.");
            }
        }

        /// <summary>
        /// Marks a thread read up to now for the caller, so its unread count in
        /// the inbox clears. Only a participant of the thread may do this.
        /// </summary>
        public async Task<WorkaResponse<bool>> MarkReadAsync(string userId, string jobId, string professionalId)
        {
            try
            {
                var (thread, error) = await ResolveThreadAsync(userId, jobId, professionalId);
                if (error != null)
                {
                    return new WorkaResponse<bool>(error);
                }

                var userGuid = Guid.Parse(userId);
                var existing = await _dbContext.MessageReads.FirstOrDefaultAsync(r =>
                    r.UserId == userGuid
                    && r.JobId == thread.Job.JobId
                    && r.ProfessionalId == thread.Professional.ProfessionalId);

                if (existing == null)
                {
                    _dbContext.MessageReads.Add(new MessageRead
                    {
                        UserId = userGuid,
                        JobId = thread.Job.JobId,
                        ProfessionalId = thread.Professional.ProfessionalId,
                        LastReadAt = DateTimeOffset.UtcNow,
                    });
                }
                else
                {
                    existing.LastReadAt = DateTimeOffset.UtcNow;
                }

                await _dbContext.SaveChangesAsync();
                return new WorkaResponse<bool>(true);
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "An error occurred while updating the conversation.");
            }
        }

        private sealed class ThreadContext
        {
            public Job Job { get; init; }

            public Professional Professional { get; init; }
        }

        /// <summary>
        /// Works out which (job, professional) thread the caller may touch.
        /// The job's customer picks the thread via <paramref name="professionalId"/>;
        /// a professional is always pinned to their own thread. Anyone else
        /// is turned away.
        /// </summary>
        private async Task<(ThreadContext Thread, string Error)> ResolveThreadAsync(
            string userId, string jobId, string professionalId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return (null, "Invalid user identity.");
            }

            if (!Guid.TryParse(jobId, out var jobGuid))
            {
                return (null, "Invalid job ID format.");
            }

            var job = await _dbContext.Jobs.FirstOrDefaultAsync(j => j.JobId == jobGuid);
            if (job == null)
            {
                return (null, "Job not found.");
            }

            var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
            if (customer != null && customer.CustomerId == job.CustomerId)
            {
                // The job owner picks which professional's thread to open.
                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return (null, "Invalid professional ID format.");
                }

                var threadProfessional = await _dbContext.Professionals
                    .FirstOrDefaultAsync(p => p.ProfessionalId == professionalGuid);
                if (threadProfessional == null)
                {
                    return (null, "Professional not found.");
                }

                return (new ThreadContext { Job = job, Professional = threadProfessional }, null);
            }

            var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);
            if (professional != null)
            {
                // Professionals may only ever read/write their own thread.
                if (!string.IsNullOrWhiteSpace(professionalId)
                    && (!Guid.TryParse(professionalId, out var requestedGuid)
                        || requestedGuid != professional.ProfessionalId))
                {
                    return (null, "Not part of this conversation.");
                }

                return (new ThreadContext { Job = job, Professional = professional }, null);
            }

            return (null, "Not part of this conversation.");
        }

        /// <summary>
        /// A thread is unredacted once the job's accepted quote belongs to
        /// that thread's professional.
        /// </summary>
        private async Task<bool> IsBookedWithProfessionalAsync(Job job, Guid professionalId)
        {
            if (job.AcceptedQuoteId == null)
            {
                return false;
            }

            var acceptedQuote = await _dbContext.Quotes
                .FirstOrDefaultAsync(q => q.QuoteId == job.AcceptedQuoteId);

            return acceptedQuote != null && acceptedQuote.ProfessionalId == professionalId;
        }
    }
}
