namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        [Route("health")]
        public IActionResult Get()
        {
            return Ok(new { status = "ok" });
        }
    }
}
