namespace Worka.Services.Database.DatabaseModels
{
    public class PasswordResetToken
    {
        public Guid TokenId { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public DateTimeOffset ExpiresAt { get; set; }

        public DateTimeOffset? UsedAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
