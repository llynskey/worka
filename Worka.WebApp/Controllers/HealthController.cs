using Worka.Services.Database;
using Worka.Services.Email;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class HealthController : ControllerBase
    {
        private readonly WorkaDbContext _dbContext;
        private readonly IEmailService _emailService;

        public HealthController(WorkaDbContext dbContext, IEmailService emailService)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        }

        [HttpGet("health")]
        [HttpGet("~/health")]
        public async Task<IActionResult> Get()
        {
            var email = _emailService.IsConfigured ? "configured" : "not_configured";
            var databaseHealthy = await _dbContext.Database.CanConnectAsync();
            if (!databaseHealthy)
            {
                return StatusCode(503, new { status = "degraded", database = "unreachable", email });
            }

            return Ok(new { status = "ok", database = "ok", email });
        }
    }
}
