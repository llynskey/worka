using Microsoft.EntityFrameworkCore;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Quotes;

namespace Worka.Services.Quotes
{
    public class QuoteService : IQuoteService
    {
        private readonly WorkaDbContext _dbContext;

        public QuoteService(WorkaDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkaResponse<QuoteResponseDTO>> CreateQuoteAsync(string userId, CreateQuoteDTO quoteDto)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<QuoteResponseDTO>("Invalid user identity.");
                }

                if (!Guid.TryParse(quoteDto.JobId, out var jobGuid))
                {
                    return new WorkaResponse<QuoteResponseDTO>("Invalid job ID format.");
                }

                if (quoteDto.Price <= 0)
                {
                    return new WorkaResponse<QuoteResponseDTO>("Quote price must be greater than zero.");
                }

                var professional = await _dbContext.Professionals
                    .FirstOrDefaultAsync(p => p.UserId == userGuid);
                if (professional == null)
                {
                    return new WorkaResponse<QuoteResponseDTO>("Professional profile not found.");
                }

                var jobExists = await _dbContext.Jobs.AnyAsync(job => job.JobId == jobGuid);
                if (!jobExists)
                {
                    return new WorkaResponse<QuoteResponseDTO>("Job not found.");
                }

                var quote = new Quote
                {
                    ProfessionalId = professional.ProfessionalId,
                    Price = quoteDto.Price,
                    JobId = jobGuid,
                    Description = (quoteDto.Description ?? string.Empty).Trim(),
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _dbContext.Quotes.Add(quote);
                await _dbContext.SaveChangesAsync();

                return new WorkaResponse<QuoteResponseDTO>(new QuoteResponseDTO(quote));
            }
            catch (Exception ex)
            {
                return WorkaResponse<QuoteResponseDTO>.Fail(ex, "An error occurred while creating the quote.");
            }
        }

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesForCustomerUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Invalid user identity.");
                }

                var customer = await _dbContext.Customers
                    .FirstOrDefaultAsync(c => c.UserId == userGuid);
                if (customer == null)
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Customer profile not found.");
                }

                var jobIds = await _dbContext.Jobs
                    .Where(job => job.CustomerId == customer.CustomerId)
                    .Select(job => job.JobId)
                    .ToListAsync();

                if (!jobIds.Any())
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>(new List<QuoteResponseDTO>());
                }

                var quotes = await _dbContext.Quotes
                    .Where(quote => jobIds.Contains(quote.JobId))
                    .OrderByDescending(quote => quote.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<QuoteResponseDTO>>(quotes.Select(q => new QuoteResponseDTO(q)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<QuoteResponseDTO>>.Fail(ex, "An error occurred while retrieving the quotes.");
            }
        }

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesForProfessionalUserAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Invalid user identity.");
                }

                var professional = await _dbContext.Professionals
                    .FirstOrDefaultAsync(p => p.UserId == userGuid);
                if (professional == null)
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Professional profile not found.");
                }

                var quotes = await _dbContext.Quotes
                    .Where(quote => quote.ProfessionalId == professional.ProfessionalId)
                    .OrderByDescending(quote => quote.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<QuoteResponseDTO>>(quotes.Select(q => new QuoteResponseDTO(q)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<QuoteResponseDTO>>.Fail(ex, "An error occurred while retrieving the quotes by professional ID.");
            }
        }

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId)
        {
            try
            {
                if (!Guid.TryParse(jobId, out var jobGuid))
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Invalid job ID format.");
                }

                var quotes = await _dbContext.Quotes
                    .Where(quote => quote.JobId == jobGuid)
                    .OrderByDescending(quote => quote.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<QuoteResponseDTO>>(quotes.Select(quote => new QuoteResponseDTO(quote)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<QuoteResponseDTO>>.Fail(ex, "An error occurred while retrieving the quotes by job ID.");
            }
        }
    }
}
