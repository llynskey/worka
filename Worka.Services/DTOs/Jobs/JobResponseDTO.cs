using Worka.Services.Database.DatabaseModels;
using Worka.Services.Enums;

namespace Worka.Services.DTOs.Jobs
{
    public class JobResponseDTO
    {
        public string JobId { get; set; }

        public string JobName { get; set; }

        public string JobDescription { get; set; }

        public string CustomerId { get; set; }
        
        public string AcceptedQuoteId { get; set; }

        public JobStatusEnum JobStatus { get; set; }

        public JobResponseDTO(Job job) 
        {
            JobId = job.JobId.ToString();
            JobName = job.Name;
            JobDescription = job.Description;
            JobStatus = job.Status;
            CustomerId = job.CustomerId.ToString();
            AcceptedQuoteId = job.AcceptedQuoteId.ToString();
        }
    }
}
