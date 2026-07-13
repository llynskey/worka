using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Interest;

namespace Worka.Services.Interest
{
    public class InterestRegistrationService : IInterestRegistrationService
    {
        private readonly WorkaDbContext _dbContext;

        public InterestRegistrationService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<InterestRegistrationResponseDTO>> RegisterAsync(CreateInterestRegistrationDTO request)
        {
            try
            {
                var email = request.Email.Trim();
                var normalizedEmail = email.ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return new WorkaResponse<InterestRegistrationResponseDTO>("Name is required.");
                }

                if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                {
                    return new WorkaResponse<InterestRegistrationResponseDTO>("A valid email is required.");
                }

                var existing = await _dbContext.InterestRegistrations
                    .FirstOrDefaultAsync(registration => registration.NormalizedEmail == normalizedEmail);

                if (existing != null)
                {
                    existing.Name = request.Name.Trim();
                    existing.Email = email;
                    existing.Role = request.Role.Trim();
                    existing.Language = request.Language.Trim();
                    existing.Location = request.Location.Trim();
                    existing.Message = request.Message.Trim();
                    existing.Source = string.IsNullOrWhiteSpace(request.Source) ? "landing-page" : request.Source.Trim();
                    existing.UpdatedAt = DateTimeOffset.UtcNow;

                    await _dbContext.SaveChangesAsync();

                    return new WorkaResponse<InterestRegistrationResponseDTO>(
                        new InterestRegistrationResponseDTO(existing),
                        message: "Interest updated.");
                }

                var registration = new InterestRegistration
                {
                    Name = request.Name.Trim(),
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    Role = request.Role.Trim(),
                    Language = request.Language.Trim(),
                    Location = request.Location.Trim(),
                    Message = request.Message.Trim(),
                    Source = string.IsNullOrWhiteSpace(request.Source) ? "landing-page" : request.Source.Trim(),
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _dbContext.InterestRegistrations.Add(registration);
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<InterestRegistrationResponseDTO>(
                    new InterestRegistrationResponseDTO(registration),
                    message: "Interest registered.");
            }
            catch (Exception ex)
            {
                return WorkaResponse<InterestRegistrationResponseDTO>.Fail(
                    ex,
                    "An error occurred while registering interest.");
            }
        }
    }
}
