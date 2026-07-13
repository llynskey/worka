namespace Worka.Services.DTOs.Interest
{
    public class CreateInterestRegistrationDTO
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Language { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Source { get; set; } = "landing-page";
    }
}
