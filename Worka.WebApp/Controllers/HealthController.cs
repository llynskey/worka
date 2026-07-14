namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class HealthController : ControllerBase
    {
        [HttpGet("health")]
        [HttpGet("~/health")]
        public IActionResult Get()
        {
            return Ok(new { status = "ok" });
        }
    }
}
