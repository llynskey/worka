using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Messages;

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

        public MessagesService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
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
