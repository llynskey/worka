using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Enums;

namespace Worka.Services.DTOs.Users
{
    public class UserRegisterDTO : BaseUserDTO
    {
        public string Password { get; set; }
        public AccountTypeEnum AccountType { get; set; }
    }
}
