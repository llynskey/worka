namespace API.Models
{
    public interface IUserContext
    {
        string AccountType { get; }
        string Username { get; }
    }
}