namespace Worka.Services.DTOs.Quotes
{
    public class CreateQuoteDTO
    {
        public string ProfessionalId { get; set; }

        public string JobId { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
    }
}