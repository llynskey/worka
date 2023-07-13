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
        [HttpGet]
        [Route("/")]
        public async Task<IActionResult> Get()
        {
            return Ok("Lawrence is a genius!");
        }
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Post(LoginRequest loginRequest)
        {
            _logger.LogInformation("Login");

            // Build query parameters
            var param = new { username = loginRequest.Email, password = Hash(loginRequest.Password) };
            return Ok();
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> Post(UserServiceModel userModel)
        {
            await _usersService.CreateUserAsync(userModel);
            // If username already exists add error        
            return Ok();
        }
    }
}
