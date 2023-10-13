using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Users
{
    public class UserResponseDTO : BaseUserDTO
    {
        public string UserId { get; set; }
        public AccountTypeEnum AccountType { get; set; }
        public DateTimeOffset CreatedDate { get; set; }
    }
}
