using Worka.Services.DTOs.Users;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IUsersService _usersService;

        public UserController(ILogger<UserController> logger, IUsersService usersService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _usersService = usersService;
        }
        
        [HttpGet]
        [Route("/")]
        public async Task<IActionResult> Get()
        {
            return Ok("Lawrence is a genius!");
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Post(UserLoginDTO loginRequest)
        {
            var jwt = await _usersService.AuthUserAsync(loginRequest);
            return jwt != null ? Ok(jwt) : Unauthorized();
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> Post(UserRegisterDTO userModel)
        {
            await _usersService.CreateUserAsync(userModel);
            // If username already exists add error        
            return Ok();
        }
    }
}
