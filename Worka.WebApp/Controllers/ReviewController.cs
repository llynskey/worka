using System.Security.Claims;
using Worka.Services.DTOs.Reviews;
using Worka.Services.Reviews;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewsService _reviewsService;

        public ReviewController(IReviewsService reviewsService)
        {
            _reviewsService = reviewsService ?? throw new ArgumentNullException(nameof(reviewsService));
        }

        [HttpPost("Jobs/{jobId}/review")]
        public async Task<IActionResult> Create(string jobId, [FromBody] CreateReviewDTO request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _reviewsService.CreateReviewAsync(userId, jobId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("Professionals/{professionalId}/reviews")]
        public async Task<IActionResult> GetForProfessional(string professionalId)
        {
            var result = await _reviewsService.GetForProfessionalAsync(professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
