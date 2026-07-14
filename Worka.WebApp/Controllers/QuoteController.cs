using System.Security.Claims;
using Worka.Services.DTOs.Quotes;
using Worka.Services.Quotes;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api")]
    public class QuoteController : ControllerBase
    {
        private readonly ILogger<QuoteController> _logger;
        private readonly IQuoteService _quoteService;

        public QuoteController(ILogger<QuoteController> logger, IQuoteService quoteService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _quoteService = quoteService ?? throw new ArgumentNullException(nameof(quoteService));
        }

        [HttpPost("createQuote")]
        [HttpPost("~/createQuote")]
        public async Task<IActionResult> Create([FromBody] CreateQuoteDTO quoteRequest)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _quoteService.CreateQuoteAsync(userId, quoteRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("Quotes/{quoteId}")]
        public async Task<IActionResult> Update(string quoteId, [FromBody] UpdateQuoteDTO quoteRequest)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _quoteService.UpdateQuoteAsync(userId, quoteId, quoteRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("Quotes/{quoteId}")]
        public async Task<IActionResult> Withdraw(string quoteId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _quoteService.WithdrawQuoteAsync(userId, quoteId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("ProfessionalQuotes")]
        [HttpGet("~/ProfessionalQuotes")]
        public async Task<IActionResult> GetProfessionalQuotes()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _quoteService.GetQuotesForProfessionalUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("CustomerQuotes")]
        [HttpGet("~/CustomerQuotes")]
        public async Task<IActionResult> GetCustomerQuotes()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _quoteService.GetQuotesForCustomerUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("QuotesByJobId")]
        [HttpGet("~/QuotesByJobId")]
        public async Task<IActionResult> GetQuotesByJobId(string jobId)
        {
            var result = await _quoteService.GetQuotesByJobIdAsync(jobId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
