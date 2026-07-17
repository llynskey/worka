namespace Worka.Services.Database.DatabaseModels
{
    /// <summary>A professional a customer has saved for quick access.</summary>
    public class Favourite
    {
        public Guid FavouriteId { get; set; } = Guid.NewGuid();

        public Guid CustomerId { get; set; }

        public Guid ProfessionalId { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
