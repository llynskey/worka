using Worka.Services.Enums;

namespace Worka.Services.Database.Models;

public class User
{
    public Guid UserId { get; set; } = Guid.NewGuid();

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    public AccountTypeEnum AccountType { get; set; }

    public DateTimeOffset CreatedDate { get; set; } = DateTimeOffset.UtcNow;

    public User()
    {
    }

    public User(
        string firstName,
        string lastName,
        string email,
        byte[] passwordHash,
        byte[] passwordSalt,
        AccountTypeEnum accountType,
        DateTimeOffset createdDate)
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
