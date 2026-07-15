using System.Security.Claims;
using Worka.Services.Customers;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService ?? throw new ArgumentNullException(nameof(customerService));
        }

        public class UpdateAccountRequest
        {
            public string FirstName { get; set; } = string.Empty;

            public string LastName { get; set; } = string.Empty;

            public string Email { get; set; } = string.Empty;

            public string Phone { get; set; }

            public string Address { get; set; }

            public string Languages { get; set; }

            public string PhotoUrl { get; set; }

            public string PreferredCurrency { get; set; }
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _customerService.GetByUserIdAsync(userId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("account")]
        public async Task<IActionResult> UpdateAccount([FromBody] UpdateAccountRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _customerService.UpdateAsync(
                userId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.Phone,
                request.Address,
                request.Languages,
                request.PhotoUrl,
                request.PreferredCurrency);

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
