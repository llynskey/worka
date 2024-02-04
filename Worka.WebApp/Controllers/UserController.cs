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

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Post(UserLoginDTO loginRequest)
        {
            try
            {
                var jwt = await _usersService.AuthUserAsync(loginRequest);
                return Ok(new { token = jwt });
            }
            catch (Exception ex)
            {
                // Check for specific messages related to authorization
                if (ex.Message == "User not found." || ex.Message == "Invalid password.")
                {
                    return Unauthorized(new { message = ex.Message });
                }

                // Otherwise, return a generic bad request
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> Post(UserRegisterDTO userModel)
        {
            try
            {
                var jwt = await _usersService.CreateUserAsync(userModel);
                return Ok(new { token = jwt });
            }
            catch (Exception ex)
            {
                // Return the exception's message directly to the client.
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
