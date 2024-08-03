using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Worka.Services.Common;
using Worka.Services.DTOs.Quotes;
using Worka.Services.DTOs.Quotes.Worka.Services.DTOs.Quotes;

namespace Worka.Services.Quotes
{
    public interface IQuoteService
    {
        Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByCustomerIdAsync(string customerId);
        Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByProfessionalIdAsync(string professionalId);
        Task<ApiResponse<QuoteResponseDTO>> CreateQuoteAsync(CreateQuoteDTO quoteDto);
        Task<ApiResponse<List<QuoteResponseDTO>>> GetAllQuotesAsync();
        Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId);
    }
}
