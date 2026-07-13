namespace Worka.Services.Database.DatabaseModels
{
    public class InterestRegistration
    {
        public Guid InterestRegistrationId { get; set; } = Guid.NewGuid();

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string NormalizedEmail { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Language { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Source { get; set; } = "landing-page";

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
