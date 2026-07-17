namespace Worka.Services.DTOs.Jobs
{
    public class ScheduleJobDTO
    {
        /// <summary>Proposed appointment time (ISO 8601).</summary>
        public DateTimeOffset? ScheduledAt { get; set; }
    }
}
