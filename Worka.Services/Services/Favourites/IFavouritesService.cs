using Worka.Services.Common;

namespace Worka.Services.Favourites
{
    public interface IFavouritesService
    {
        /// <summary>The professional ids the customer has saved.</summary>
        Task<WorkaResponse<List<string>>> GetForCustomerAsync(string userId);

        /// <summary>Toggles a saved professional; returns true if now saved.</summary>
        Task<WorkaResponse<bool>> ToggleAsync(string userId, string professionalId);
    }
}
