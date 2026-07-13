using Worka.Services.Common;
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
            _usersService = usersService ?? throw new ArgumentNullException(nameof(usersService));
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO loginRequest)
        {
            var result = await _usersService.AuthUserAsync(loginRequest);
            if (!result.Success)
            {
                _logger.LogWarning("Failed login attempt for {Email}: {Message}", loginRequest.Email, result.Message);
                return Unauthorized(result);
            }

            return Ok(ToAuthResponse(result));
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> Signup([FromBody] UserRegisterDTO userModel)
        {
            var result = await _usersService.CreateUserAsync(userModel);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(ToAuthResponse(result));
        }

        private static object ToAuthResponse(WorkaResponse<UserResponseDTO> result)
        {
            return new
            {
                success = result.Success,
                message = result.Message,
                token = result.Token,
                user = result.Data
            };
        }
    }
}
