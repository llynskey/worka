using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Professionals
{
    public class ProfessionalResponseDTO
    {
        public string ProfessionalId { get; set; }

        public string UserId { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string Specialty { get; set; }

        public string Bio { get; set; }

        public string ServiceArea { get; set; }

        public string Languages { get; set; }

        public string PhotoUrl { get; set; }

        public bool StripeConnected { get; set; }

        public bool StripeChargesEnabled { get; set; }

        public bool StripePayoutsEnabled { get; set; }

        public bool StripeDetailsSubmitted { get; set; }

        public ProfessionalResponseDTO(Professional professional)
        {
            ProfessionalId = professional.ProfessionalId.ToString();
            UserId = professional.UserId.ToString();
            FirstName = professional.FirstName;
            LastName = professional.LastName;
            Email = professional.Email;
            Specialty = professional.Specialty;
            Bio = professional.Bio;
            ServiceArea = professional.ServiceArea;
            Languages = professional.Languages;
            PhotoUrl = professional.PhotoUrl;
            StripeConnected = !string.IsNullOrWhiteSpace(professional.StripeAccountId);
            StripeChargesEnabled = professional.StripeChargesEnabled;
            StripePayoutsEnabled = professional.StripePayoutsEnabled;
            StripeDetailsSubmitted = professional.StripeDetailsSubmitted;
        }
    }
}
