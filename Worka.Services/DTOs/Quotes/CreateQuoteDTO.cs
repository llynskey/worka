namespace Worka.Services.DTOs.Quotes
{
    public class CreateQuoteDTO
    {
        public string JobId { get; set; }
        public string ProfessionalId { get; set; }
        public decimal? Price { get; set; }
        public string Description { get; set; }
    }
}
