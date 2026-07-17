using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;

namespace Worka.Services.Favourites
{
    public class FavouritesService : IFavouritesService
    {
        private readonly WorkaDbContext _dbContext;

        public FavouritesService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<List<string>>> GetForCustomerAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<string>>("Invalid user identity.");
                }

                var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<List<string>>(new List<string>());
                }

                var ids = await _dbContext.Favourites
                    .Where(f => f.CustomerId == customer.CustomerId)
                    .Select(f => f.ProfessionalId.ToString())
                    .ToListAsync();

                return new WorkaResponse<List<string>>(ids);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<string>>.Fail(ex, "An error occurred while loading saved professionals.");
            }
        }

        public async Task<WorkaResponse<bool>> ToggleAsync(string userId, string professionalId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<bool>("Invalid user identity.");
                }

                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return new WorkaResponse<bool>("Invalid professional ID format.");
                }

                var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<bool>("Customer profile not found.");
                }

                var existing = await _dbContext.Favourites.FirstOrDefaultAsync(f =>
                    f.CustomerId == customer.CustomerId && f.ProfessionalId == professionalGuid);

                if (existing != null)
                {
                    _dbContext.Favourites.Remove(existing);
                    await _dbContext.SaveChangesAsync();
                    return new WorkaResponse<bool>(false);
                }

                _dbContext.Favourites.Add(new Favourite
                {
                    CustomerId = customer.CustomerId,
                    ProfessionalId = professionalGuid,
                    CreatedAt = DateTimeOffset.UtcNow,
                });
                await _dbContext.SaveChangesAsync();
                return new WorkaResponse<bool>(true);
            }
            catch (Exception ex)
            {
                return WorkaResponse<bool>.Fail(ex, "An error occurred while saving the professional.");
            }
        }
    }
}
