using System.IO;
using System.Security.Claims;
using Worka.Services.DTOs.Payments;
using Worka.Services.Payments;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentsService _paymentsService;

        public PaymentsController(IPaymentsService paymentsService)
        {
            _paymentsService = paymentsService ?? throw new ArgumentNullException(nameof(paymentsService));
        }

        [Authorize]
        [HttpGet("stripe/status")]
        public async Task<IActionResult> GetStripeStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _paymentsService.GetProfessionalStripeStatusAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpPost("stripe/onboarding")]
        public async Task<IActionResult> CreateStripeOnboarding([FromBody] CreateStripeOnboardingRequestDTO request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _paymentsService.CreateProfessionalOnboardingLinkAsync(
                userId,
                request.ReturnUrl,
                request.RefreshUrl);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpPost("jobs/{jobId}/quotes/{quoteId}/checkout")]
        public async Task<IActionResult> CreateQuoteCheckout(
            string jobId,
            string quoteId,
            [FromBody] CreateCheckoutRequestDTO request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _paymentsService.CreateQuoteCheckoutAsync(
                userId,
                jobId,
                quoteId,
                request.SuccessUrl,
                request.CancelUrl);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpGet("earnings")]
        public async Task<IActionResult> GetEarnings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _paymentsService.GetEarningsForProfessionalAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _paymentsService.GetPaymentHistoryForCustomerAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [AllowAnonymous]
        [HttpPost("stripe/webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? string.Empty;

            var result = await _paymentsService.HandleStripeWebhookAsync(payload, signature);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
