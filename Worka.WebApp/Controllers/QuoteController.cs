using Worka.Services.DTOs.Quotes;
using Worka.Services.DTOs.Quotes.Worka.Services.DTOs.Quotes;
using Worka.Services.Quotes;
namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class QuoteController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IQuoteService _quoteService;
        public QuoteController(ILogger<UserController> logger, IQuoteService quoteService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _quoteService = quoteService ?? throw new ArgumentNullException(nameof(quoteService));
        }

        [HttpPost]
        [Route("createQuote")]
        public async Task<IActionResult> Post(CreateQuoteDTO quoteRequest)
        {
            var result = await _quoteService.CreateQuoteAsync(quoteRequest);
            return Ok(result);
        }

        [HttpGet]
        [Route("ProfessionalQuotes")]
        public async Task<IActionResult> GetProfessionalQuotes(string professionalId)
        {
            var result = await _quoteService.GetQuotesByProfessionalIdAsync(professionalId);

            return Ok(result);
        }

        [HttpGet]
        [Route("CustomerQuotes")]
        public async Task<IActionResult> GetCustomerQuotes(string customerId)
        {
            var result = await _quoteService.GetQuotesByCustomerIdAsync(customerId);

            return Ok(result);
        }

        [HttpGet]
        [Route("Quotes")]
        public async Task<IActionResult> GetAllQuotes() 
        {
            var quotes = await _quoteService.GetAllQuotesAsync();

            return Ok(quotes);

        }

        [HttpGet]
        [Route("QuotesByJobId")]
        public async Task<IActionResult> GetQuotesByJobId(string jobId)
        {
            var quotes = await _quoteService.GetQuotesByJobIdAsync(jobId);
            return Ok(quotes);
        }
    }
}
