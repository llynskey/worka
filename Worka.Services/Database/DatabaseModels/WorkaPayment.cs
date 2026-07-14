namespace Worka.Services.Database.DatabaseModels
{
    public class WorkaPayment
    {
        public Guid PaymentId { get; set; } = Guid.NewGuid();

        public Guid JobId { get; set; }

        public Guid QuoteId { get; set; }

        public Guid CustomerId { get; set; }

        public Guid ProfessionalId { get; set; }

        public string StripeCheckoutSessionId { get; set; } = string.Empty;

        public string StripePaymentIntentId { get; set; } = string.Empty;

        public string StripeConnectedAccountId { get; set; } = string.Empty;

        public decimal QuoteAmount { get; set; }

        public decimal ServiceFeeAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public decimal WorkerAmount { get; set; }

        public string Currency { get; set; } = "gbp";

        public string Status { get; set; } = "pending_checkout";

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
