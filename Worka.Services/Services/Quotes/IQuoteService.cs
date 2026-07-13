using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Common;
using Worka.Services.DTOs.Quotes;

namespace Worka.Services.Quotes
{
    public interface IQuoteService
    {
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByCustomerIdAsync(string customerId);
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByProfessionalIdAsync(string professionalId);
        Task<WorkaResponse<QuoteResponseDTO>> CreateQuoteAsync(CreateQuoteDTO quoteDto);
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetAllQuotesAsync();
        Task<WorkaResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId);
    }
}
