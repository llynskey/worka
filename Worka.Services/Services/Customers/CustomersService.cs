using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Customers;

namespace Worka.Services.Customers
{
    public class CustomersService : ICustomerService
    {
        private readonly WorkaDbContext _dbContext;

        public CustomersService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<CustomerResponseDTO>> GetByUserIdAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<CustomerResponseDTO>("Invalid user ID format.");
            }

            var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);

            return customer == null
                ? new WorkaResponse<CustomerResponseDTO>("Customer profile not found.")
                : new WorkaResponse<CustomerResponseDTO>(new CustomerResponseDTO(customer));
        }

        public async Task<WorkaResponse<CustomerResponseDTO>> UpdateAsync(
            string userId,
            string firstName,
            string lastName,
            string email,
            string phone = null,
            string address = null,
            string languages = null,
            string photoUrl = null,
            string preferredCurrency = null)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<CustomerResponseDTO>("Invalid user ID format.");
            }

            var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
            if (customer == null)
            {
                return new WorkaResponse<CustomerResponseDTO>("Customer profile not found.");
            }

            customer.FirstName = firstName.Trim();
            customer.LastName = lastName.Trim();
            customer.Email = email.Trim().ToLowerInvariant();
            if (phone != null) customer.Phone = phone.Trim();
            if (address != null) customer.Address = address.Trim();
            if (languages != null) customer.Languages = NormalizeLanguages(languages);
            if (photoUrl != null) customer.PhotoUrl = UploadPaths.SanitizeProfilePhoto(photoUrl);
            if (preferredCurrency != null) customer.PreferredCurrency = Currencies.Sanitize(preferredCurrency);
            customer.UpdatedAt = DateTimeOffset.UtcNow;

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
            if (user != null)
            {
                user.FirstName = customer.FirstName;
                user.LastName = customer.LastName;
                user.Email = customer.Email;
            }

            await _dbContext.SaveChangesAsync();
            return new WorkaResponse<CustomerResponseDTO>(new CustomerResponseDTO(customer));
        }

        internal static string NormalizeLanguages(string languages)
        {
            var codes = (languages ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(code => code.ToLowerInvariant())
                .Where(code => code.Length is >= 2 and <= 8)
                .Distinct()
                .Take(10);

            return string.Join(',', codes);
        }

        public async Task<WorkaResponse<CustomerResponseDTO>> EnsureExistsAsync(
            string userId,
            string email,
            string firstName,
            string lastName)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<CustomerResponseDTO>("Invalid user ID format.");
            }

            var existing = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
            if (existing != null)
            {
                return new WorkaResponse<CustomerResponseDTO>(new CustomerResponseDTO(existing));
            }

            var customer = new Customer
            {
                UserId = userGuid,
                Email = email.Trim().ToLowerInvariant(),
                FirstName = firstName.Trim(),
                LastName = lastName.Trim(),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Customers.Add(customer);
            await _dbContext.SaveChangesAsync();

            return new WorkaResponse<CustomerResponseDTO>(new CustomerResponseDTO(customer));
        }
    }
}
