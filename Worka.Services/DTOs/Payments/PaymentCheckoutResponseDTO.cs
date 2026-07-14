namespace Worka.Services.DTOs.Payments
{
    public class PaymentCheckoutResponseDTO
    {
        public string PaymentId { get; set; } = string.Empty;

        public string CheckoutSessionId { get; set; } = string.Empty;

        public string CheckoutUrl { get; set; } = string.Empty;

        public decimal QuoteAmount { get; set; }

        public decimal ServiceFeeAmount { get; set; }

        public decimal WorkerAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public string Currency { get; set; } = "gbp";
    }
}
