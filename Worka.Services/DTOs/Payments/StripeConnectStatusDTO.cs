namespace Worka.Services.DTOs.Payments
{
    public class StripeConnectStatusDTO
    {
        public bool Connected { get; set; }

        public bool ChargesEnabled { get; set; }

        public bool PayoutsEnabled { get; set; }

        public bool DetailsSubmitted { get; set; }

        public bool ReadyForPayments => Connected && ChargesEnabled && PayoutsEnabled;

        public string StripeAccountId { get; set; } = string.Empty;
    }
}
