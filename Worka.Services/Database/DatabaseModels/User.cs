namespace Worka.Services.Database.Models
{
    public class User
    {
        [BsonId]
        public ObjectId UserId { get; set; } = ObjectId.GenerateNewId();

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public DateTimeOffset CreatedDate { get; set; }
    }
}
