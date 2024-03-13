using Worka.Services.DTOs.Jobs;
using Worka.Services.Jobs;
namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class JobController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IJobsService _JobService;
        public JobController(ILogger<UserController> logger, IJobsService JobService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _JobService = JobService ?? throw new ArgumentNullException(nameof(JobService));
        }

        [HttpPost]
        [Route("createJob")]
        public async Task<IActionResult> Post(CreateJobDTO JobRequest)
        {
            var result = await _JobService.CreateJob(JobRequest);
            return Ok(result);
        }

        [HttpGet]
        [Route("ProfessionalJobs")]
        public async Task<IActionResult> GetProfessionalJobs(string professionalId)
        {
            var result = await _JobService.GetJobsByProfessionalIdAsync(professionalId);

            return Ok(result);
        }

        [HttpGet]
        [Route("CustomerJobs")]
        public async Task<IActionResult> GetCustomerJobs(string customerId)
        {
            var result = await _JobService.GetJobsByCustomerIdAsync(customerId);

            return Ok(result);
        }

        [HttpGet]
        [Route("Jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var Jobs = await _JobService.GetAllJobs();

            return Ok(Jobs);

        }
    }
}
