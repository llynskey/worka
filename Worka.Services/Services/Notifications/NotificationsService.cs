using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Notifications;

namespace Worka.Services.Notifications
{
    public class NotificationsService : INotificationsService
    {
        private const int MaxTitle = 280;
        private const int MaxBody = 1000;

        private readonly WorkaDbContext _dbContext;

        public NotificationsService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task NotifyAsync(Guid recipientUserId, string type, string title, string body, Guid? jobId = null)
        {
            if (recipientUserId == Guid.Empty)
            {
                return;
            }

            var notification = new Notification
            {
                UserId = recipientUserId,
                Type = Truncate(type, 40),
                Title = Truncate(title, MaxTitle),
                Body = Truncate(body, MaxBody),
                JobId = jobId,
                Read = false,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            try
            {
                _dbContext.Notifications.Add(notification);
                await _dbContext.SaveChangesAsync();
            }
            catch
            {
                // Never let a notification failure bubble into the caller's flow.
                // Detach so the caller's DbContext stays clean for any later work.
                try
                {
                    _dbContext.Entry(notification).State = EntityState.Detached;
                }
                catch
                {
                    // ignore
                }
            }
        }

        public async Task<WorkaResponse<List<NotificationResponseDTO>>> GetForUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<NotificationResponseDTO>>("Invalid user identity.");
                }

                var items = await _dbContext.Notifications
                    .Where(n => n.UserId == userGuid)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(50)
                    .Select(n => new NotificationResponseDTO(n))
                    .ToListAsync();

                return new WorkaResponse<List<NotificationResponseDTO>>(items);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<NotificationResponseDTO>>.Fail(ex, "An error occurred while loading notifications.");
            }
        }

        public async Task<WorkaResponse<int>> GetUnreadCountAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<int>("Invalid user identity.");
                }

                var count = await _dbContext.Notifications
                    .CountAsync(n => n.UserId == userGuid && !n.Read);

                return new WorkaResponse<int>(count);
            }
            catch (Exception ex)
            {
                return WorkaResponse<int>.Fail(ex, "An error occurred while loading notifications.");
            }
        }

        public async Task<WorkaResponse<bool>> MarkReadAsync(string userId, string notificationId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<bool>("Invalid user identity.");
                }

                if (!Guid.TryParse(notificationId, out var notificationGuid))
                {
                    return new WorkaResponse<bool>("Invalid notification ID format.");
                }

                var notification = await _dbContext.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationId == notificationGuid && n.UserId == userGuid);
                if (notification == null)
                {
                    return new WorkaResponse<bool>("Notification not found.");
                }

                if (!notification.Read)
                {
                    notification.Read = true;
                    await _dbContext.SaveChangesAsync();
                }

                return new WorkaResponse<bool>(true);
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "An error occurred while updating the notification.");
            }
        }

        public async Task<WorkaResponse<bool>> MarkAllReadAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<bool>("Invalid user identity.");
                }

                var unread = await _dbContext.Notifications
                    .Where(n => n.UserId == userGuid && !n.Read)
                    .ToListAsync();

                foreach (var notification in unread)
                {
                    notification.Read = true;
                }

                if (unread.Count > 0)
                {
                    await _dbContext.SaveChangesAsync();
                }

                return new WorkaResponse<bool>(true);
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "An error occurred while updating notifications.");
            }
        }

        private static string Truncate(string value, int max)
        {
            value ??= string.Empty;
            return value.Length <= max ? value : value.Substring(0, max);
        }
    }
}
