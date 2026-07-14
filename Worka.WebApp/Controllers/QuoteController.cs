using Worka.Services.DTOs.Quotes;
using Worka.Services.Quotes;

namespace Worka.WebApp.Controllers
{
    [ApiController]
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
            var result = await _quoteService.CreateQuoteAsync(quoteRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("ProfessionalQuotes")]
        [HttpGet("~/ProfessionalQuotes")]
        public async Task<IActionResult> GetProfessionalQuotes(string professionalId)
        {
            var result = await _quoteService.GetQuotesByProfessionalIdAsync(professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("CustomerQuotes")]
        [HttpGet("~/CustomerQuotes")]
        public async Task<IActionResult> GetCustomerQuotes(string customerId)
        {
            var result = await _quoteService.GetQuotesByCustomerIdAsync(customerId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("Quotes")]
        [HttpGet("~/Quotes")]
        public async Task<IActionResult> GetAllQuotes()
        {
            var result = await _quoteService.GetAllQuotesAsync();
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
