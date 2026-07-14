using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Professionals;

namespace Worka.Services.Professionals
{
    public class ProfessionalsService : IProfessionalsService
    {
        private readonly WorkaDbContext _dbContext;

        public ProfessionalsService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<List<ProfessionalDirectoryItemDTO>>> GetDirectoryAsync(
            string search,
            string specialty,
            string area,
            decimal? maxPrice)
        {
            try
            {
                var query = _dbContext.Professionals.AsQueryable();

                if (!string.IsNullOrWhiteSpace(specialty))
                {
                    var term = specialty.Trim().ToLower();
                    query = query.Where(p => p.Specialty.ToLower().Contains(term));
                }

                if (!string.IsNullOrWhiteSpace(area))
                {
                    var term = area.Trim().ToLower();
                    query = query.Where(p => p.ServiceArea.ToLower().Contains(term));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var term = search.Trim().ToLower();
                    query = query.Where(p =>
                        p.FirstName.ToLower().Contains(term) ||
                        p.LastName.ToLower().Contains(term) ||
                        p.Specialty.ToLower().Contains(term) ||
                        p.Bio.ToLower().Contains(term) ||
                        p.ServiceArea.ToLower().Contains(term));
                }

                var professionals = await query
                    .OrderByDescending(p => p.StripeChargesEnabled && p.StripePayoutsEnabled)
                    .ThenBy(p => p.FirstName)
                    .Take(200)
                    .ToListAsync();

                var professionalIds = professionals.Select(p => p.ProfessionalId).ToList();
                var quoteStats = await _dbContext.Quotes
                    .Where(quote => professionalIds.Contains(quote.ProfessionalId))
                    .GroupBy(quote => quote.ProfessionalId)
                    .Select(group => new
                    {
                        ProfessionalId = group.Key,
                        Count = group.Count(),
                        Average = group.Average(quote => quote.Price),
                        Min = group.Min(quote => quote.Price)
                    })
                    .ToListAsync();
                var statsById = quoteStats.ToDictionary(s => s.ProfessionalId);

                var items = professionals
                    .Select(p =>
                    {
                        statsById.TryGetValue(p.ProfessionalId, out var stats);
                        return new ProfessionalDirectoryItemDTO
                        {
                            ProfessionalId = p.ProfessionalId.ToString(),
                            FirstName = p.FirstName,
                            LastName = p.LastName,
                            Specialty = p.Specialty,
                            Bio = p.Bio,
                            ServiceArea = p.ServiceArea,
                            QuoteCount = stats?.Count ?? 0,
                            AverageQuotePrice = stats == null ? null : Math.Round(stats.Average, 2),
                            MinQuotePrice = stats?.Min,
                            ReadyForPayments = p.StripeChargesEnabled && p.StripePayoutsEnabled
                        };
                    })
                    .Where(item => !maxPrice.HasValue
                        || (item.AverageQuotePrice.HasValue && item.AverageQuotePrice.Value <= maxPrice.Value))
                    .ToList();

                return new WorkaResponse<List<ProfessionalDirectoryItemDTO>>(items);
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<ProfessionalDirectoryItemDTO>>.Fail(
                    ex, "An error occurred while loading professionals.");
            }
        }

        public async Task<WorkaResponse<ProfessionalResponseDTO>> GetByUserIdAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<ProfessionalResponseDTO>("Invalid user ID format.");
            }

            var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);

            return professional == null
                ? new WorkaResponse<ProfessionalResponseDTO>("Professional profile not found.")
                : new WorkaResponse<ProfessionalResponseDTO>(new ProfessionalResponseDTO(professional));
        }

        public async Task<WorkaResponse<ProfessionalResponseDTO>> UpdateAsync(
            string userId,
            string firstName,
            string lastName,
            string email,
            string specialty,
            string bio,
            string serviceArea)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<ProfessionalResponseDTO>("Invalid user ID format.");
            }

            var professional = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);
            if (professional == null)
            {
                return new WorkaResponse<ProfessionalResponseDTO>("Professional profile not found.");
            }

            professional.FirstName = firstName.Trim();
            professional.LastName = lastName.Trim();
            professional.Email = email.Trim().ToLowerInvariant();
            professional.Specialty = string.IsNullOrWhiteSpace(specialty) ? "General home services" : specialty.Trim();
            professional.Bio = bio.Trim();
            professional.ServiceArea = serviceArea.Trim();
            professional.UpdatedAt = DateTimeOffset.UtcNow;

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
            if (user != null)
            {
                user.FirstName = professional.FirstName;
                user.LastName = professional.LastName;
                user.Email = professional.Email;
            }

            await _dbContext.SaveChangesAsync();
            return new WorkaResponse<ProfessionalResponseDTO>(new ProfessionalResponseDTO(professional));
        }

        public async Task<WorkaResponse<ProfessionalResponseDTO>> EnsureExistsAsync(
            string userId,
            string email,
            string firstName,
            string lastName)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return new WorkaResponse<ProfessionalResponseDTO>("Invalid user ID format.");
            }

            var existing = await _dbContext.Professionals.FirstOrDefaultAsync(p => p.UserId == userGuid);
            if (existing != null)
            {
                return new WorkaResponse<ProfessionalResponseDTO>(new ProfessionalResponseDTO(existing));
            }

            var professional = new Professional
            {
                UserId = userGuid,
                Email = email.Trim().ToLowerInvariant(),
                FirstName = firstName.Trim(),
                LastName = lastName.Trim(),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Professionals.Add(professional);
            await _dbContext.SaveChangesAsync();

            return new WorkaResponse<ProfessionalResponseDTO>(new ProfessionalResponseDTO(professional));
        }
    }
}
