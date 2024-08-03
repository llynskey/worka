using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class ProfessionalsController : ControllerBase
    {
        public async Task<IActionResult> GetProfessionalByUserId(string userId)
        {
            return Ok();
        }
    }
}
