using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Worka.Services.Dev;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/dev")]
    public class DevController : ControllerBase
    {
        private readonly IDevSeedService _devSeedService;
        private readonly IConfiguration _configuration;

        public DevController(IDevSeedService devSeedService, IConfiguration configuration)
        {
            _devSeedService = devSeedService ?? throw new ArgumentNullException(nameof(devSeedService));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        // Seeds sample data for the signed-in user. Disabled unless Dev:AllowSeed
        // (env Dev__AllowSeed) is "true", so it can never run on a normal prod deploy.
        [HttpPost("seed")]
        public async Task<IActionResult> Seed()
        {
            if (!string.Equals(_configuration["Dev:AllowSeed"], "true", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _devSeedService.SeedForUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
