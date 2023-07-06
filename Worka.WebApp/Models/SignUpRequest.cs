using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class SignUpRequest
    {
        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(20, MinimumLength = 8)]
        public string Username { get; set; }

        [Required]
        [StringLength(20, MinimumLength = 8)]
        public string Password { get; set; }

        [Required]
        public string AddressLine1 { get; set; }

        public string AddressLine2 { get; set; }

        public string AddressLine3 { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string Region { get; set; }

        [Required]
        public string PostCode { get; set; }
    }
}
