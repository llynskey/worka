namespace Worka.Services.Database.DatabaseModels
{
    public class Quote
    {
        public Guid QuoteId { get; set; } = Guid.NewGuid();

        public Guid ProfessionalId { get; set; }

        public Guid JobId { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        /// <summary>Optional appointment time the professional proposes with the quote.</summary>
        public DateTimeOffset? ScheduledAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
