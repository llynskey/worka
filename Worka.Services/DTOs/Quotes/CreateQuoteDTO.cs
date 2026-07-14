namespace Worka.Services.DTOs.Quotes
{
    public class CreateQuoteDTO
    {
        public string JobId { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string Description { get; set; } = string.Empty;
    }
}
