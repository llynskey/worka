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
