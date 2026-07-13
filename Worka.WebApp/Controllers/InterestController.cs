using Worka.Services.DTOs.Interest;
using Worka.Services.Interest;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class InterestController : ControllerBase
    {
        private readonly IInterestRegistrationService _interestRegistrationService;

        public InterestController(IInterestRegistrationService interestRegistrationService)
        {
            _interestRegistrationService = interestRegistrationService
                ?? throw new ArgumentNullException(nameof(interestRegistrationService));
        }

        [HttpPost]
        [Route("interest")]
        public async Task<IActionResult> RegisterInterest([FromBody] CreateInterestRegistrationDTO request)
        {
            var result = await _interestRegistrationService.RegisterAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
