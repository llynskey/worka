using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Payments
{
    /// <summary>One paid transaction, enriched with the job and counterpart name
    /// so it reads as a receipt / earnings line on either side.</summary>
    public class PaymentHistoryItemDTO
    {
        public string PaymentId { get; set; }
        public string JobId { get; set; }
        public string JobName { get; set; } = string.Empty;
        public string CounterpartName { get; set; } = string.Empty;
        public decimal QuoteAmount { get; set; }
        public decimal ServiceFeeAmount { get; set; }
        public decimal WorkerAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public DateTimeOffset PaidAt { get; set; }

        public PaymentHistoryItemDTO(WorkaPayment payment, string jobName, string counterpartName)
        {
            PaymentId = payment.PaymentId.ToString();
            JobId = payment.JobId.ToString();
            JobName = jobName ?? string.Empty;
            CounterpartName = counterpartName ?? string.Empty;
            QuoteAmount = payment.QuoteAmount;
            ServiceFeeAmount = payment.ServiceFeeAmount;
            WorkerAmount = payment.WorkerAmount;
            TotalAmount = payment.TotalAmount;
            Currency = payment.Currency;
            Status = payment.Status;
            PaidAt = payment.UpdatedAt;
        }
    }

    /// <summary>Professional earnings view: what they've been paid across bookings.</summary>
    public class EarningsSummaryDTO
    {
        public decimal TotalEarned { get; set; }
        public decimal ThisMonth { get; set; }
        public int BookingsCount { get; set; }
        public string Currency { get; set; } = "gbp";
        public List<PaymentHistoryItemDTO> Payments { get; set; } = new();
    }

    /// <summary>Customer spend view: receipts for what they've paid.</summary>
    public class CustomerSpendSummaryDTO
    {
        public decimal TotalSpent { get; set; }
        public int PaymentsCount { get; set; }
        public string Currency { get; set; } = "gbp";
        public List<PaymentHistoryItemDTO> Payments { get; set; } = new();
    }
}
