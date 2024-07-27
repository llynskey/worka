using Worka.Services.Enums;

namespace Worka.Services.Database.Models;

public class User
{
    [BsonId]
    public ObjectId UserId { get; } = ObjectId.GenerateNewId();

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string Email { get; set; }

    public byte[] PasswordHash { get; set; }

    public byte[] PasswordSalt { get; set; }

    public AccountTypeEnum AccountType { get; set; }

    public DateTimeOffset CreatedDate { get; set; }

    public User(string firstName, string lastName, string email, byte[] passwordHash, byte[] passwordSalt, AccountTypeEnum accountType, DateTimeOffset createdDate)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        PasswordHash = passwordHash;
        PasswordSalt = passwordSalt;
        AccountType = accountType;
        CreatedDate = createdDate;
    }
}

