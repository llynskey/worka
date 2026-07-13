namespace Worka.Models
{
    public interface IUserContext
    {
        string AccountType { get; }
        string Username { get; }
    }
}