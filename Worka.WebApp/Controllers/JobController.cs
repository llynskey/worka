using System.Security.Claims;
using Worka.Services.DTOs.Jobs;
using Worka.Services.Jobs;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
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

        [HttpPost("createJob")]
        [HttpPost("~/createJob")]
        public async Task<IActionResult> Create([FromBody] CreateJobDTO jobRequest)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.CreateJobAsync(userId, jobRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("Jobs/{jobId}")]
        public async Task<IActionResult> Update(string jobId, [FromBody] UpdateJobDTO jobRequest)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.UpdateJobAsync(userId, jobId, jobRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("Jobs/{jobId}")]
        public async Task<IActionResult> Delete(string jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.DeleteJobAsync(userId, jobId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Jobs/{jobId}/complete")]
        public async Task<IActionResult> Complete(string jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.CompleteJobAsync(userId, jobId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("ProfessionalJobs")]
        [HttpGet("~/ProfessionalJobs")]
        public async Task<IActionResult> GetProfessionalJobs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.GetJobsForProfessionalUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("CustomerJobs")]
        [HttpGet("~/CustomerJobs")]
        public async Task<IActionResult> GetCustomerJobs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _jobService.GetJobsForCustomerUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("Jobs")]
        [HttpGet("~/Jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _jobService.GetAllJobsAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
