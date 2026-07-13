using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Quotes
{
    public class QuoteResponseDTO
    {
        public string QuoteId { get; set; }

        public string ProfessionalId { get; set; }

        public string JobId { get; set; }

        public decimal Price { get; set; }

        public string Description { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        public QuoteResponseDTO(Quote quote)
        {
            QuoteId = quote.QuoteId.ToString();
            ProfessionalId = quote.ProfessionalId.ToString();
            JobId = quote.JobId.ToString();
            Price = quote.Price;
            Description = quote.Description;
            CreatedAt = quote.CreatedAt;
        }
    }
}
