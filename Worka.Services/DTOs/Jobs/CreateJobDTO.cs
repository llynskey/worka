namespace Worka.Services.DTOs.Jobs
{
    public class CreateJobDTO
    {
        public string JobName { get; set; } = string.Empty;

        public string JobDescription { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string CustomerId { get; set; } = string.Empty;
    }
}
