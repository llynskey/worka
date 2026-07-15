namespace Worka.Services.Database.DatabaseModels
{
    /// <summary>
    /// Tracks how far a single user has read a given (job, professional) chat
    /// thread. One row per (user, thread); <see cref="LastReadAt"/> advances
    /// each time the user opens the thread, and anything the other party sent
    /// after it counts as unread.
    /// </summary>
    public class MessageRead
    {
        public Guid MessageReadId { get; set; } = Guid.NewGuid();

        /// <summary>UserId of the reader (customer or professional).</summary>
        public Guid UserId { get; set; }

        public Guid JobId { get; set; }

        /// <summary>The professional side of the (job, professional) conversation.</summary>
        public Guid ProfessionalId { get; set; }

        public DateTimeOffset LastReadAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
