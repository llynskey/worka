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

        public async Task<WorkaResponse<QuoteResponseDTO>> CreateQuoteAsync(CreateQuoteDTO quoteDto)
        {
            try
            {
                if (!Guid.TryParse(quoteDto.JobId, out var jobGuid))
                {
                    return new WorkaResponse<QuoteResponseDTO>("Invalid job ID format.");
                }

                if (!Guid.TryParse(quoteDto.ProfessionalId, out var professionalGuid))
                {
                    return new WorkaResponse<QuoteResponseDTO>("Invalid professional ID format.");
                }

                var jobExists = await _dbContext.Jobs.AnyAsync(job => job.JobId == jobGuid);
                if (!jobExists)
                {
                    return new WorkaResponse<QuoteResponseDTO>("Job not found.");
                }

                var professionalExists = await _dbContext.Professionals.AnyAsync(professional => professional.ProfessionalId == professionalGuid);
                if (!professionalExists)
                {
                    return new WorkaResponse<QuoteResponseDTO>("Professional profile not found.");
                }

                var quote = new Quote
                {
                    ProfessionalId = professionalGuid,
                    Price = quoteDto.Price,
                    JobId = jobGuid,
                    Description = quoteDto.Description.Trim(),
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

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByCustomerIdAsync(string customerId)
        {
            try
            {
                if (!Guid.TryParse(customerId, out var customerGuid))
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Invalid customer ID format.");
                }

                var jobIds = await _dbContext.Jobs
                    .Where(job => job.CustomerId == customerGuid)
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

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByProfessionalIdAsync(string professionalId)
        {
            try
            {
                if (!Guid.TryParse(professionalId, out var professionalGuid))
                {
                    return new WorkaResponse<List<QuoteResponseDTO>>("Invalid professional ID format.");
                }

                var quotes = await _dbContext.Quotes
                    .Where(quote => quote.ProfessionalId == professionalGuid)
                    .OrderByDescending(quote => quote.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<QuoteResponseDTO>>(quotes.Select(q => new QuoteResponseDTO(q)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<QuoteResponseDTO>>.Fail(ex, "An error occurred while retrieving the quotes by professional ID.");
            }
        }

        public async Task<WorkaResponse<List<QuoteResponseDTO>>> GetAllQuotesAsync()
        {
            try
            {
                var quotes = await _dbContext.Quotes
                    .OrderByDescending(quote => quote.CreatedAt)
                    .ToListAsync();

                return new WorkaResponse<List<QuoteResponseDTO>>(quotes.Select(quote => new QuoteResponseDTO(quote)).ToList());
            }
            catch (Exception ex)
            {
                return WorkaResponse<List<QuoteResponseDTO>>.Fail(ex, "An error occurred while retrieving all quotes.");
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
