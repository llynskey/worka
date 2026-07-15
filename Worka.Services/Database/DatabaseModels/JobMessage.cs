namespace Worka.Services.Database.DatabaseModels
{
    public class JobMessage
    {
        public Guid JobMessageId { get; set; } = Guid.NewGuid();

        public Guid JobId { get; set; }

        /// <summary>The professional side of the (job, professional) conversation.</summary>
        public Guid ProfessionalId { get; set; }

        /// <summary>UserId of whoever wrote the message (customer or professional).</summary>
        public Guid SenderUserId { get; set; }

        public string Body { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
