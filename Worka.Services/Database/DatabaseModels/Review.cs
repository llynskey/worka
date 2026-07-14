namespace Worka.Services.Database.DatabaseModels
{
    public class Review
    {
        public Guid ReviewId { get; set; } = Guid.NewGuid();

        /// <summary>One review per job, written by the job's customer.</summary>
        public Guid JobId { get; set; }

        public Guid CustomerId { get; set; }

        public Guid ProfessionalId { get; set; }

        /// <summary>1–5 stars.</summary>
        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
