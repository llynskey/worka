namespace Worka.Services.Database.DatabaseModels
{
    public class Customer
    {
        public Guid CustomerId { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        /// <summary>Comma-separated ISO language codes, e.g. "en,es".</summary>
        public string Languages { get; set; } = string.Empty;

        public string PhotoUrl { get; set; } = string.Empty;

        /// <summary>Currency new jobs are posted in, e.g. "gbp".</summary>
        public string PreferredCurrency { get; set; } = "gbp";

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
