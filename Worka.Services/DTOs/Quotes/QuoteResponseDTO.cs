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

        // Professional summary — populated for customer-facing quote lists so
        // the customer can see who is quoting and how they are rated.
        public string ProfessionalFirstName { get; set; } = string.Empty;

        public string ProfessionalLastName { get; set; } = string.Empty;

        public string ProfessionalPhotoUrl { get; set; } = string.Empty;

        public string ProfessionalSpecialty { get; set; } = string.Empty;

        public double? ProfessionalRating { get; set; }

        public int ProfessionalReviewCount { get; set; }

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
