using Worka.Services.Common;
using Worka.Services.DTOs.Quotes;

namespace Worka.Services.Quotes
{
    public interface IQuoteService
    {
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesForCustomerUserAsync(string userId);
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesForProfessionalUserAsync(string userId);
        Task<WorkaResponse<QuoteResponseDTO>> CreateQuoteAsync(string userId, CreateQuoteDTO quoteDto);
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId);
    }
}
