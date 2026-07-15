using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Worka.Services.Common;
using Worka.Services.DTOs.Users;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api")]
    [EnableRateLimiting("auth")]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IUsersService _usersService;

        public UserController(ILogger<UserController> logger, IUsersService usersService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _usersService = usersService ?? throw new ArgumentNullException(nameof(usersService));
        }

        [HttpPost("login")]
        [HttpPost("~/login")]
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

        [HttpPost("signup")]
        [HttpPost("~/signup")]
        public async Task<IActionResult> Signup([FromBody] UserRegisterDTO userModel)
        {
            var result = await _usersService.CreateUserAsync(userModel);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(ToAuthResponse(result));
        }

        [Authorize]
        [HttpPost("account/changePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO request)
        {
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _usersService.ChangePasswordAsync(userId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDTO request)
        {
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _usersService.DeleteAccountAsync(userId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpPost("account/switchMode")]
        public async Task<IActionResult> SwitchMode()
        {
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _usersService.SwitchAccountTypeAsync(userId);
            return result.Success ? Ok(ToAuthResponse(result)) : BadRequest(result);
        }

        [HttpPost("forgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO request)
        {
            var result = await _usersService.ForgotPasswordAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("resetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO request)
        {
            var result = await _usersService.ResetPasswordAsync(request);
            return result.Success ? Ok(result) : BadRequest(result);
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
