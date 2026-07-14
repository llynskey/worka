namespace Worka.Services.DTOs.Payments
{
    public class CreateStripeOnboardingRequestDTO
    {
        public string ReturnUrl { get; set; } = string.Empty;

        public string RefreshUrl { get; set; } = string.Empty;
    }
}
