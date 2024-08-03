using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Quotes
{
    public class QuoteResponseDTO
    {
        private Quote q;

        public QuoteResponseDTO(Quote q)
        {
            this.q = q;
        }

        public string QuoteId { get; set; }

        public string? ProfessionalId { get; set; }

        public decimal? Price { get; set; }
    }
}