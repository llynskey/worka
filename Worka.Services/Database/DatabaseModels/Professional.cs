namespace Worka.Services.Database.DatabaseModels
{
    public class Professional
    {
        public Guid ProfessionalId { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Specialty { get; set; } = "General home services";

        public string Bio { get; set; } = string.Empty;

        public string ServiceArea { get; set; } = string.Empty;

        /// <summary>Human-readable label for the work base, e.g. "Leeds, UK".</summary>
        public string LocationLabel { get; set; } = string.Empty;

        /// <summary>Work base latitude; null until the professional sets a location.</summary>
        public double? Latitude { get; set; }

        /// <summary>Work base longitude; null until the professional sets a location.</summary>
        public double? Longitude { get; set; }

        /// <summary>Comma-separated ISO language codes, e.g. "en,pl,ro".</summary>
        public string Languages { get; set; } = string.Empty;

        public string PhotoUrl { get; set; } = string.Empty;

        public string StripeAccountId { get; set; } = string.Empty;

        public bool StripeChargesEnabled { get; set; }

        public bool StripePayoutsEnabled { get; set; }

        public bool StripeDetailsSubmitted { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
