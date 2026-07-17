using Worka.Services.Common;
using Worka.Services.DTOs.Notifications;

namespace Worka.Services.Notifications
{
    public interface INotificationsService
    {
        /// <summary>
        /// Best-effort: records an in-app notification for the recipient. Never
        /// throws — a notification failure must not break the action that
        /// triggered it.
        /// </summary>
        Task NotifyAsync(Guid recipientUserId, string type, string title, string body, Guid? jobId = null);

        Task<WorkaResponse<List<NotificationResponseDTO>>> GetForUserAsync(string userId);

        Task<WorkaResponse<int>> GetUnreadCountAsync(string userId);

        Task<WorkaResponse<bool>> MarkReadAsync(string userId, string notificationId);

        Task<WorkaResponse<bool>> MarkAllReadAsync(string userId);
    }
}
