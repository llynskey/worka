namespace Worka.Models
{
    // Core/Users/User.cs
    public class User
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = string.Empty;
        public string Firstname { get; set; } = string.Empty;
        public string Lastname { get; set; } = string.Empty;

        // Navigation
        public CustomerProfile CustomerProfile { get; set; }
        public ProfessionalProfile ProfessionalProfile { get; set; }
    }

    // Core/Users/CustomerProfile.cs
    public class CustomerProfile
    {
        public string Id { get; set; } = default!;
        public string UserId { get; set; } = default!;
        public User User { get; set; } = default!;
        public string PreferredLanguage { get; set; } = string.Empty;
        // Other customer fields can be added here.
    }

    // Core/Users/ProfessionalProfile.cs
    public class ProfessionalProfile
    {
        public string Id { get; set; } = default!;
        public string UserId { get; set; } = default!;
        public User User { get; set; } = default!;
        public string CompanyName { get; set; } = string.Empty;
        // Other professional fields can be added here.
    }

}
