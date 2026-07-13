using System.Security.Claims;

namespace Worka.Models
{
    public class UserContext : IUserContext
    {
        public UserContext(IEnumerable<Claim> claims)
        {
            Username = claims.SingleOrDefault(claim => claim.Type == "user").Value;
            AccountType = claims.SingleOrDefault(claim => claim.Type == "account_type").Value;
        }

        public string Username { get; }
        public string AccountType { get; }
    }
}
