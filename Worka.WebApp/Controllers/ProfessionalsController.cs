using System.Security.Claims;
using Worka.Services.Professionals;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfessionalsController : ControllerBase
    {
        private readonly IProfessionalsService _professionalsService;

        public ProfessionalsController(IProfessionalsService professionalsService)
        {
            _professionalsService = professionalsService ?? throw new ArgumentNullException(nameof(professionalsService));
        }

        public class UpdateProfessionalAccountRequest
        {
            public string FirstName { get; set; } = string.Empty;

            public string LastName { get; set; } = string.Empty;

            public string Email { get; set; } = string.Empty;

            public string Specialty { get; set; } = string.Empty;

            public string Bio { get; set; } = string.Empty;

            public string ServiceArea { get; set; } = string.Empty;

            public string Languages { get; set; }

            public string PhotoUrl { get; set; }
        }

        [HttpGet("directory")]
        public async Task<IActionResult> GetDirectory(
            string search = "",
            string specialty = "",
            string area = "",
            decimal? maxPrice = null,
            string language = "")
        {
            var result = await _professionalsService.GetDirectoryAsync(search, specialty, area, maxPrice, language);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _professionalsService.GetByUserIdAsync(userId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("account")]
        public async Task<IActionResult> UpdateAccount([FromBody] UpdateProfessionalAccountRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _professionalsService.UpdateAsync(
                userId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.Specialty,
                request.Bio,
                request.ServiceArea,
                request.Languages,
                request.PhotoUrl);

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
