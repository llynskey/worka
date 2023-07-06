namespace Worka.WebApp.OAuth
{
    public interface IJwtTokenBuilder
    {
        string Build(string user, string accountType);
    }
}