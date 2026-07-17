using Worka.Services.Common;

namespace Worka.Services.Dev
{
    public interface IDevSeedService
    {
        /// <summary>
        /// Seeds sample jobs / quotes / paid bookings for the current user so the
        /// money, booking, schedule and review flows can be exercised without real
        /// payments. Dev/test only — gated by config at the controller.
        /// </summary>
        Task<WorkaResponse<string>> SeedForUserAsync(string userId);
    }
}
