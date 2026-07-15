using System.Security.Claims;
using Worka.Services.DTOs.Messages;
using Worka.Services.Messages;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api")]
    public class MessageController : ControllerBase
    {
        private readonly IMessagesService _messagesService;

        public MessageController(IMessagesService messagesService)
        {
            _messagesService = messagesService ?? throw new ArgumentNullException(nameof(messagesService));
        }

        [HttpGet("messages")]
        public async Task<IActionResult> ListConversations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            // The inbox is scoped to the active session's role so a user who holds
            // both profiles never sees their professional threads as a customer.
            var role = User.FindFirstValue(ClaimTypes.Role);
            var result = await _messagesService.ListConversationsAsync(userId, role);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Jobs/{jobId}/messages/read")]
        public async Task<IActionResult> MarkRead(string jobId, [FromBody] MarkThreadReadDTO request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _messagesService.MarkReadAsync(userId, jobId, request?.ProfessionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("Jobs/{jobId}/messages")]
        public async Task<IActionResult> GetThread(string jobId, [FromQuery] string professionalId = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _messagesService.GetThreadAsync(userId, jobId, professionalId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Jobs/{jobId}/messages")]
        public async Task<IActionResult> Send(string jobId, [FromBody] SendJobMessageDTO request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _messagesService.SendAsync(userId, jobId, request?.ProfessionalId, request?.Body);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
