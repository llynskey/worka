using Worka.Services.Database;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class HealthController : ControllerBase
    {
        private readonly WorkaDbContext _dbContext;

        public HealthController(WorkaDbContext dbContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        }

        [HttpGet("health")]
        [HttpGet("~/health")]
        public async Task<IActionResult> Get()
        {
            var databaseHealthy = await _dbContext.Database.CanConnectAsync();
            if (!databaseHealthy)
            {
                return StatusCode(503, new { status = "degraded", database = "unreachable" });
            }

            return Ok(new { status = "ok", database = "ok" });
        }
    }
}
