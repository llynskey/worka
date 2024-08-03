using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class ProfessionalsController : ControllerBase
    {
        public IActionResult GetProfessionalByUserId(string userId)
        {
            return Ok();
        }
    }
}
