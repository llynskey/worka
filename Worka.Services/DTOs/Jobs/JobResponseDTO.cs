using Worka.Services.Common;
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

        public string PhotoUrl { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public string CustomerId { get; set; }

        public string AcceptedQuoteId { get; set; }

        public JobStatusEnum JobStatus { get; set; }

        public string Currency { get; set; }

        /// <summary>
        /// Comma-separated ISO language codes the job's customer speaks, so the
        /// marketplace can surface and filter jobs by language fit. Set by the
        /// service (not derived from the Job row).
        /// </summary>
        public string CustomerLanguages { get; set; } = string.Empty;

        /// <summary>True when the location has been reduced to an area for privacy.</summary>
        public bool LocationApproximate { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }

        public JobResponseDTO(Job job, bool maskLocation = false)
        {
            JobId = job.JobId.ToString();
            JobName = job.Name;
            JobDescription = job.Description;
            Category = job.Category;
            Address = job.Address;
            LocationLabel = job.LocationLabel;
            PhotoUrl = job.PhotoUrl;
            Latitude = job.Latitude;
            Longitude = job.Longitude;
            JobStatus = job.Status;
            CustomerId = job.CustomerId.ToString();
            AcceptedQuoteId = job.AcceptedQuoteId?.ToString();
            Currency = job.Currency;
            CreatedAt = job.CreatedAt;
            UpdatedAt = job.UpdatedAt;

            if (maskLocation)
            {
                // The exact place of work is only shared with the professional
                // whose quote was accepted and paid.
                Address = LocationPrivacy.MaskAddress(job.Address);
                LocationLabel = LocationPrivacy.MaskAddress(
                    string.IsNullOrWhiteSpace(job.LocationLabel) ? job.Address : job.LocationLabel);
                Latitude = LocationPrivacy.BlurCoordinate(job.Latitude);
                Longitude = LocationPrivacy.BlurCoordinate(job.Longitude);
                LocationApproximate = true;
            }
        }
    }
}
