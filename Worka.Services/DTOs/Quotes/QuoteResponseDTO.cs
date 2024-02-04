namespace Worka.Services.DTOs.Quotes
{
    public class QuoteResponseDTO
    {
        public string QuoteId { get; set; }

        public string? ProfessionalId { get; set; }

        public decimal? Price { get; set; }
    }
}