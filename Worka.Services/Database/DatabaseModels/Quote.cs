using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worka.Services.Database.DatabaseModels
{
    public class Quote
    {
        [BsonId]
        public ObjectId QuoteId { get; set; } = ObjectId.GenerateNewId();

        public ObjectId? ProfessionalId { get; set; }
        public ObjectId? JobId { get; set; }
        public string Description { get; set; }
        public decimal? Price { get; set; }
    }
}
