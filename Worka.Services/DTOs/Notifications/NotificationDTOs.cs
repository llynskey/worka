using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Notifications
{
    public class NotificationResponseDTO
    {
        public NotificationResponseDTO()
        {
        }

        public NotificationResponseDTO(Notification entity)
        {
            NotificationId = entity.NotificationId.ToString();
            Type = entity.Type;
            Title = entity.Title;
            Body = entity.Body;
            JobId = entity.JobId?.ToString();
            Read = entity.Read;
            CreatedAt = entity.CreatedAt;
        }

        public string NotificationId { get; set; }

        public string Type { get; set; }

        public string Title { get; set; }

        public string Body { get; set; }

        public string JobId { get; set; }

        public bool Read { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}
