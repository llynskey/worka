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

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
