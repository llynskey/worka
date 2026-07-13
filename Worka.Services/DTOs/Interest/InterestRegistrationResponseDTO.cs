using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Interest
{
    public class InterestRegistrationResponseDTO
    {
        public string InterestRegistrationId { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        public string Role { get; set; }

        public string Language { get; set; }

        public string Location { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        public InterestRegistrationResponseDTO(InterestRegistration registration)
        {
            InterestRegistrationId = registration.InterestRegistrationId.ToString();
            Name = registration.Name;
            Email = registration.Email;
            Role = registration.Role;
            Language = registration.Language;
            Location = registration.Location;
            CreatedAt = registration.CreatedAt;
        }
    }
}
