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

        public JobStatusEnum Status { get; set; } = JobStatusEnum.Pending;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
