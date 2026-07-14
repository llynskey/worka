namespace Worka.Services.DTOs.Professionals
{
    public class ProfessionalDirectoryItemDTO
    {
        public string ProfessionalId { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Specialty { get; set; } = string.Empty;

        public string Bio { get; set; } = string.Empty;

        public string ServiceArea { get; set; } = string.Empty;

        public int QuoteCount { get; set; }

        public decimal? AverageQuotePrice { get; set; }

        public decimal? MinQuotePrice { get; set; }

        public bool ReadyForPayments { get; set; }

        public string Languages { get; set; } = string.Empty;

        public string PhotoUrl { get; set; } = string.Empty;

        public double? AverageRating { get; set; }

        public int ReviewCount { get; set; }
    }
}
