namespace Worka.Services.DTOs.Jobs
{
    public class UpdateJobDTO
    {
        public string JobName { get; set; } = string.Empty;

        public string JobDescription { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string LocationLabel { get; set; } = string.Empty;

        public string PhotoUrl { get; set; } = string.Empty;

        public string Currency { get; set; } = "gbp";

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }
    }
}
