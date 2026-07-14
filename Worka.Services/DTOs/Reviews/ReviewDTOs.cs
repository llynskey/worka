using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Reviews
{
    public class CreateReviewDTO
    {
        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;
    }

    public class ReviewResponseDTO
    {
        public string ReviewId { get; set; } = string.Empty;

        public string JobId { get; set; } = string.Empty;

        public string ProfessionalId { get; set; } = string.Empty;

        public string ReviewerFirstName { get; set; } = string.Empty;

        public string JobName { get; set; } = string.Empty;

        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; }

        public ReviewResponseDTO()
        {
        }

        public ReviewResponseDTO(Review review, string reviewerFirstName, string jobName)
        {
            ReviewId = review.ReviewId.ToString();
            JobId = review.JobId.ToString();
            ProfessionalId = review.ProfessionalId.ToString();
            ReviewerFirstName = reviewerFirstName;
            JobName = jobName;
            Rating = review.Rating;
            Comment = review.Comment;
            CreatedAt = review.CreatedAt;
        }
    }
}
