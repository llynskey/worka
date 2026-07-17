namespace Worka.Services.Database.DatabaseModels
{
    /// <summary>
    /// An in-app notification for one recipient user. Emitted best-effort by the
    /// domain services (new quote, new message, booking, completion, review) and
    /// surfaced in the notification centre.
    /// </summary>
    public class Notification
    {
        public Guid NotificationId { get; set; } = Guid.NewGuid();

        /// <summary>The recipient (users.UserId).</summary>
        public Guid UserId { get; set; }

        /// <summary>Machine-readable kind: quote | message | booking | completed | review.</summary>
        public string Type { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        /// <summary>Optional job this notification relates to, for deep-linking.</summary>
        public Guid? JobId { get; set; }

        public bool Read { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
