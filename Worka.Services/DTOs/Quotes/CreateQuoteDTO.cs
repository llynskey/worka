namespace Worka.Services.DTOs.Quotes
{
    public class CreateQuoteDTO
    {
        public string JobId { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string Description { get; set; } = string.Empty;

        /// <summary>Optional proposed appointment time (ISO 8601).</summary>
        public DateTimeOffset? ScheduledAt { get; set; }
    }
}
