using Worka.Services.Enums;

namespace Worka.Services.Database.DatabaseModels
{
    public class Job
    {
        public Guid JobId { get; set; } = Guid.NewGuid();

        public Guid CustomerId { get; set; }

        public Guid? AcceptedQuoteId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string LocationLabel { get; set; } = string.Empty;

        public string PhotoUrl { get; set; } = string.Empty;

        /// <summary>ISO currency code the job is priced in, e.g. "gbp".</summary>
        public string Currency { get; set; } = "gbp";

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public JobStatusEnum Status { get; set; } = JobStatusEnum.Pending;

        /// <summary>Agreed appointment time once booked (copied from the accepted quote, then editable).</summary>
        public DateTimeOffset? ScheduledAt { get; set; }

        /// <summary>True once both sides have confirmed the scheduled time.</summary>
        public bool ScheduleConfirmed { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
