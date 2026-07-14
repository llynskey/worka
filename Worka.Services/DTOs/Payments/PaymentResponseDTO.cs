using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Payments
{
    public class PaymentResponseDTO
    {
        public string PaymentId { get; set; }

        public string JobId { get; set; }

        public string QuoteId { get; set; }

        public decimal QuoteAmount { get; set; }

        public decimal ServiceFeeAmount { get; set; }

        public decimal WorkerAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public string Currency { get; set; }

        public string Status { get; set; }

        public PaymentResponseDTO(WorkaPayment payment)
        {
            PaymentId = payment.PaymentId.ToString();
            JobId = payment.JobId.ToString();
            QuoteId = payment.QuoteId.ToString();
            QuoteAmount = payment.QuoteAmount;
            ServiceFeeAmount = payment.ServiceFeeAmount;
            WorkerAmount = payment.WorkerAmount;
            TotalAmount = payment.TotalAmount;
            Currency = payment.Currency;
            Status = payment.Status;
        }
    }
}
