using System.Security.Claims;
using Worka.Services.Notifications;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationsService _notificationsService;

        public NotificationController(INotificationsService notificationsService)
        {
            _notificationsService = notificationsService ?? throw new ArgumentNullException(nameof(notificationsService));
        }

        [HttpGet("notifications")]
        public async Task<IActionResult> List()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _notificationsService.GetForUserAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("notifications/unreadCount")]
        public async Task<IActionResult> UnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _notificationsService.GetUnreadCountAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("notifications/{notificationId}/read")]
        public async Task<IActionResult> MarkRead(string notificationId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _notificationsService.MarkReadAsync(userId, notificationId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("notifications/readAll")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var result = await _notificationsService.MarkAllReadAsync(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
