using Worka.Services.Common;
using Worka.Services.DTOs.Customers;

namespace Worka.Services.Customers
{
    public interface ICustomerService
    {
        Task<WorkaResponse<CustomerResponseDTO>> GetByUserIdAsync(string userId);

        Task<WorkaResponse<CustomerResponseDTO>> UpdateAsync(
            string userId,
            string firstName,
            string lastName,
            string email,
            string phone = null,
            string address = null,
            string languages = null,
            string photoUrl = null,
            string preferredCurrency = null);

        Task<WorkaResponse<CustomerResponseDTO>> EnsureExistsAsync(
            string userId,
            string email,
            string firstName,
            string lastName);
    }
}
