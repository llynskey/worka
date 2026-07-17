using System.Security.Claims;
using Worka.Services.Favourites;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/favourites")]
    public class FavouritesController : ControllerBase
    {
        private readonly IFavouritesService _favouritesService;

        public FavouritesController(IFavouritesService favouritesService)
        {
            _favouritesService = favouritesService ?? throw new ArgumentNullException(nameof(favouritesService));
        }

        [HttpGet("")]
        public async Task<IActionResult> List()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _favouritesService.GetForCustomerAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{professionalId}/toggle")]
        public async Task<IActionResult> Toggle(string professionalId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _favouritesService.ToggleAsync(userId, professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
