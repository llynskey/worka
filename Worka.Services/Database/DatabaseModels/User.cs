using Worka.Services.Enums;

namespace Worka.Services.Database.Models
{
    public class User
    {
        [BsonId]
        public ObjectId UserId { get; set; } = ObjectId.GenerateNewId();

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public byte[] PasswordHash { get; set; }

        public byte[] PasswordSalt { get; set; }

        public AccountTypeEnum AccountType { get; set; }

        public DateTimeOffset CreatedDate { get; set; }
    }
}
