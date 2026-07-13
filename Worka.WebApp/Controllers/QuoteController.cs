using Worka.Services.DTOs.Quotes;
using Worka.Services.Quotes;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class QuoteController : ControllerBase
    {
        private readonly ILogger<QuoteController> _logger;
        private readonly IQuoteService _quoteService;

        public QuoteController(ILogger<QuoteController> logger, IQuoteService quoteService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _quoteService = quoteService ?? throw new ArgumentNullException(nameof(quoteService));
        }

        [HttpPost]
        [Route("createQuote")]
        public async Task<IActionResult> Create([FromBody] CreateQuoteDTO quoteRequest)
        {
            var result = await _quoteService.CreateQuoteAsync(quoteRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Route("ProfessionalQuotes")]
        public async Task<IActionResult> GetProfessionalQuotes(string professionalId)
        {
            var result = await _quoteService.GetQuotesByProfessionalIdAsync(professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Route("CustomerQuotes")]
        public async Task<IActionResult> GetCustomerQuotes(string customerId)
        {
            var result = await _quoteService.GetQuotesByCustomerIdAsync(customerId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Route("Quotes")]
        public async Task<IActionResult> GetAllQuotes()
        {
            var result = await _quoteService.GetAllQuotesAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        [Route("QuotesByJobId")]
        public async Task<IActionResult> GetQuotesByJobId(string jobId)
        {
            var result = await _quoteService.GetQuotesByJobIdAsync(jobId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
