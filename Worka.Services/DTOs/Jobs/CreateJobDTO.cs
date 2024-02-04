using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worka.Services.DTOs.Jobs
{
    public class CreateJobDTO
    {
        public string JobName { get; set; }

        public string JobDescription { get; set; }

        public string JobStatus { get; set; }

        public ObjectId CustomerId { get; set; }
    }
}
