using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worka.Services.Database.DatabaseModels
{
    public class Professional
    {
        public ObjectId ProfessionalId { get; set; } = ObjectId.GenerateNewId();

        public ObjectId UserId { get; set; }
    }
}
