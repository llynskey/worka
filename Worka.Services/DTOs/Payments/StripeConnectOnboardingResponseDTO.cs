namespace Worka.Services.DTOs.Payments
{
    public class StripeConnectOnboardingResponseDTO
    {
        public string Url { get; set; } = string.Empty;

        public string StripeAccountId { get; set; } = string.Empty;
    }
}
