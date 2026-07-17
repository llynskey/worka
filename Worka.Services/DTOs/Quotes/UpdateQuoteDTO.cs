namespace Worka.Services.DTOs.Quotes
{
    public class UpdateQuoteDTO
    {
        public decimal Price { get; set; }

        public string Description { get; set; } = string.Empty;

        public DateTimeOffset? ScheduledAt { get; set; }
    }
}
