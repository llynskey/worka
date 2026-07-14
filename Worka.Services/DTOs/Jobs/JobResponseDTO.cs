using Worka.Services.Database.DatabaseModels;
using Worka.Services.Enums;

namespace Worka.Services.DTOs.Jobs
{
    public class JobResponseDTO
    {
        public string JobId { get; set; }

        public string JobName { get; set; }

        public string JobDescription { get; set; }

        public string Category { get; set; }

        public string Address { get; set; }

        public string LocationLabel { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public string CustomerId { get; set; }

        public string AcceptedQuoteId { get; set; }

        public JobStatusEnum JobStatus { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        public JobResponseDTO(Job job)
        {
            JobId = job.JobId.ToString();
            JobName = job.Name;
            JobDescription = job.Description;
            Category = job.Category;
            Address = job.Address;
            LocationLabel = job.LocationLabel;
            Latitude = job.Latitude;
            Longitude = job.Longitude;
            JobStatus = job.Status;
            CustomerId = job.CustomerId.ToString();
            AcceptedQuoteId = job.AcceptedQuoteId?.ToString();
            CreatedAt = job.CreatedAt;
        }
    }
}
