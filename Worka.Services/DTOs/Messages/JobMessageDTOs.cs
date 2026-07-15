using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Messages
{
    public class SendJobMessageDTO
    {
        public string ProfessionalId { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;
    }

    public class MarkThreadReadDTO
    {
        public string ProfessionalId { get; set; } = string.Empty;
    }

    /// <summary>
    /// One row in the Messages inbox: a single (job, professional) thread as
    /// seen by the signed-in user, with a preview of the latest message and how
    /// many messages the other party has sent since the user last read it.
    /// </summary>
    public class ConversationSummaryDTO
    {
        public string JobId { get; set; } = string.Empty;

        public string JobName { get; set; } = string.Empty;

        public string ProfessionalId { get; set; } = string.Empty;

        /// <summary>The other party's display name, from the viewer's side.</summary>
        public string CounterpartName { get; set; } = string.Empty;

        public string CounterpartPhotoUrl { get; set; } = string.Empty;

        /// <summary>The viewer's own role in this thread: "customer" or "professional".</summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>Latest message body, redacted unless the thread is booked.</summary>
        public string LastMessageBody { get; set; } = string.Empty;

        /// <summary>Role of whoever sent the latest message.</summary>
        public string LastSenderRole { get; set; } = string.Empty;

        public DateTimeOffset LastMessageAt { get; set; }

        /// <summary>Messages from the other party since the viewer last read the thread.</summary>
        public int UnreadCount { get; set; }

        public bool Booked { get; set; }
    }

    public class JobMessageDTO
    {
        public string JobMessageId { get; set; } = string.Empty;

        public string JobId { get; set; } = string.Empty;

        public string ProfessionalId { get; set; } = string.Empty;

        public string SenderUserId { get; set; } = string.Empty;

        /// <summary>"customer" or "professional".</summary>
        public string SenderRole { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; }

        public JobMessageDTO()
        {
        }

        public JobMessageDTO(JobMessage message, string senderRole, string body)
        {
            JobMessageId = message.JobMessageId.ToString();
            JobId = message.JobId.ToString();
            ProfessionalId = message.ProfessionalId.ToString();
            SenderUserId = message.SenderUserId.ToString();
            SenderRole = senderRole;
            Body = body;
            CreatedAt = message.CreatedAt;
        }
    }
}
