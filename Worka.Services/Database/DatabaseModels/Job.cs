using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Enums;

namespace Worka.Services.Database.DatabaseModels
{
    public class Job
    {
        [BsonId]
        public ObjectId JobId { get; set; } = ObjectId.GenerateNewId();

        public ObjectId CustomerId { get; set; }

        public ObjectId AcceptedQuoteId { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public JobStatusEnum Status { get; set; }
    }
}
