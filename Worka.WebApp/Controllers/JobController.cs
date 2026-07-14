using Worka.Services.DTOs.Jobs;
using Worka.Services.Jobs;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class JobController : ControllerBase
    {
        private readonly ILogger<JobController> _logger;
        private readonly IJobsService _jobService;

        public JobController(ILogger<JobController> logger, IJobsService jobService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _jobService = jobService ?? throw new ArgumentNullException(nameof(jobService));
        }

        public class AcceptQuoteRequest
        {
            public string QuoteId { get; set; } = string.Empty;
        }

        [HttpPost("createJob")]
        [HttpPost("~/createJob")]
        public async Task<IActionResult> Create([FromBody] CreateJobDTO jobRequest)
        {
            var result = await _jobService.CreateJobAsync(jobRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Jobs/{jobId}/acceptQuote")]
        [HttpPost("~/Jobs/{jobId}/acceptQuote")]
        public async Task<IActionResult> AcceptQuote(string jobId, [FromBody] AcceptQuoteRequest request)
        {
            var result = await _jobService.AcceptQuoteAsync(jobId, request.QuoteId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("ProfessionalJobs")]
        [HttpGet("~/ProfessionalJobs")]
        public async Task<IActionResult> GetProfessionalJobs(string professionalId)
        {
            var result = await _jobService.GetJobsByProfessionalIdAsync(professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("CustomerJobs")]
        [HttpGet("~/CustomerJobs")]
        public async Task<IActionResult> GetCustomerJobs(string customerId)
        {
            var result = await _jobService.GetJobsByCustomerIdAsync(customerId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("Jobs")]
        [HttpGet("~/Jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var result = await _jobService.GetAllJobsAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
