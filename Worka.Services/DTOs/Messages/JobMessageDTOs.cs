using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Messages
{
    public class SendJobMessageDTO
    {
        public string ProfessionalId { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;
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
