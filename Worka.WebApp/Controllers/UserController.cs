// using API.Helpers.Database;
// using API.Models;
// using API.OAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.Security;
using System.Security.Cryptography;
using Worka.WebApp.OAuth;
using Worka.Services.ServiceModels;
using Worka.Services.Users;
// using Worka.WebApp.Database;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize(policy: "User")]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IJwtTokenBuilder _jwtTokenBuilder;
        private readonly IUsersService _usersService;

        public UserController(ILogger<UserController> logger, IJwtTokenBuilder jwtTokenBuilder, IUsersService usersService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _jwtTokenBuilder = jwtTokenBuilder ?? throw new ArgumentNullException(nameof(jwtTokenBuilder));
            _usersService = usersService ?? throw new ArgumentNullException(nameof(usersService));
        }
        //Hashes a users password input to check against the database 
        static string Hash(string input)
        {
            using (SHA1Managed sha1 = new SHA1Managed())
            {
                var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes(input));
                var sb = new StringBuilder(hash.Length * 2);
                string final;

                foreach (byte b in hash)
                {
                    // can be "x2" if you want lowercase
                    sb.Append(b.ToString("X2"));
                }
                final = "0x" + sb.ToString();
                return final.Substring(0, 20);
            }
        }
        [HttpPost]
        [AllowAnonymous]
        [Route("login")]
        public async Task<IActionResult> Post(LoginRequest loginRequest)
        {
            _logger.LogInformation("Login");


            // Build query parameters
            var param = new { username = loginRequest.Email, password = Hash(loginRequest.Password) };

            // Execute stored procedure
            var user = await _sprExecutor.QuerySingleOrDefault<User>("sprGetUser", param);

            if (user is null)
            {
                // Return error with status 401
                return Unauthorized(new { error = "Invalid Login Credentials" });
            }

            // Build response
            var response = new
            {
                user,
                token = _jwtTokenBuilder.Build(user.Username, user.AccountType.ToString())
            };
            // Return response with status 200
            return Ok(response);
        }

        [HttpPost]
        [AllowAnonymous]
        [Route("signup")]
        public async Task<IActionResult> Post(SignUpRequest signUpRequest, [FromServices] IOptions<ApiBehaviorOptions> options)
        {
            // If username already exists add error
            if (await UsernameExists(signUpRequest.Username))
            {
                ModelState.AddModelError("Username", "Username Is Already In Use");
            }

            // If email already exists add error
            if (await EmailExists(signUpRequest.Email))
            {
                ModelState.AddModelError("Email", "Email Is Already In Use");
            }

            if (!ModelState.IsValid)
            {
                // Return errors with status 400
                return options.Value.InvalidModelStateResponseFactory(ControllerContext);
            }

            _logger.LogInformation("SignUp");

            try
            {
                // Execute stored procedure
                _ = await _sprExecutor.Execute("sprInsertUser", signUpRequest);
            }
            catch (Exception)
            {
                // Return error with status 400
                return BadRequest(new { error = "Invalid SignUp Request" });
            }
            // Return status 200
            return Ok();
        }

        [HttpGet]
        [Route("info")]
        public IActionResult Get()
        {
            _logger.LogInformation("Get User Account Type");

            // Get user context
            var userContext = HttpContext.Items["user"] as IUserContext;

            if (userContext is null)
            {
                // Return error with status 401
                return Unauthorized(new { error = "Invalid Account Type" });
            }

            // Return account type with status 200
            return Ok(userContext);
        }

        private async Task<bool> UsernameExists(string username)
        {
            var value = await _sprExecutor.QuerySingleOrDefault<string>("sprgetusername", new { username = username });
            return !(value is null);
        }

        private async Task<bool> EmailExists(string email)
        {
            var value = await _sprExecutor.QuerySingleOrDefault<string>("sprgetemail", new { email = email });
            return !(value is null);
        }
    }
}
