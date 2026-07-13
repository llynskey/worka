using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.DTOs.Customers
{
    public class CustomerResponseDTO
    {
        public string CustomerId { get; set; }

        public string UserId { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public CustomerResponseDTO(Customer customer)
        {
            CustomerId = customer.CustomerId.ToString();
            UserId = customer.UserId.ToString();
            FirstName = customer.FirstName;
            LastName = customer.LastName;
            Email = customer.Email;
        }
    }
}
