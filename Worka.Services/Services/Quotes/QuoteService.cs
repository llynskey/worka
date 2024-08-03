using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using Worka.Services.Common;
using Worka.Services.Database;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;

namespace Worka.Services.Quotes
{
    public class QuoteService : IQuoteService
    {
        private readonly MongoHelperContext _mongoHelperContext;

        public QuoteService(MongoHelperContext mongoHelperContext)
        {
            _mongoHelperContext = mongoHelperContext;
        }

        public async Task<ApiResponse<QuoteResponseDTO>> CreateQuoteAsync(CreateQuoteDTO quoteDto)
        {
            try
            {
                var quote = new Quote
                {
                    ProfessionalId = ObjectId.Parse(quoteDto.ProfessionalId),
                    Price = quoteDto.Price,
                    JobId = ObjectId.Parse(quoteDto.JobId),
                    Description = quoteDto.Description
                };

                await _mongoHelperContext.Quotes.InsertOneAsync(quote);

                var responseDto = new QuoteResponseDTO(quote);
                return new ApiResponse<QuoteResponseDTO>(responseDto);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<QuoteResponseDTO>("An error occurred while creating the quote.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByCustomerIdAsync(string customerId)
        {
            try
            {
                if (!ObjectId.TryParse(customerId, out ObjectId objectIdCustomerId))
                {
                    return new ApiResponse<List<QuoteResponseDTO>>("Invalid customer ID format.");
                }

                var jobIds = await _mongoHelperContext.Jobs
                    .Find(j => j.CustomerId == objectIdCustomerId)
                    .Project(j => j.AcceptedQuoteId)
                    .ToListAsync();

                var quotes = await _mongoHelperContext.Quotes
                    .Find(q => jobIds.Contains(q.QuoteId))
                    .ToListAsync();

                var responseDtos = quotes.Select(q => new QuoteResponseDTO(q)).ToList();
                return new ApiResponse<List<QuoteResponseDTO>>(responseDtos);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<QuoteResponseDTO>>("An error occurred while retrieving the quotes.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByProfessionalIdAsync(string professionalId)
        {
            try
            {
                if (!ObjectId.TryParse(professionalId, out ObjectId objectIdProfessionalId))
                {
                    return new ApiResponse<List<QuoteResponseDTO>>("Invalid professional ID format.");
                }

                var quotes = await _mongoHelperContext.Quotes
                    .Find(q => q.ProfessionalId == objectIdProfessionalId)
                    .ToListAsync();

                var responseDtos = quotes.Select(q => new QuoteResponseDTO(q)).ToList();
                return new ApiResponse<List<QuoteResponseDTO>>(responseDtos);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<QuoteResponseDTO>>("An error occurred while retrieving the quotes by professional ID.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetAllQuotesAsync()
        {
            try
            {
                var quotes = await _mongoHelperContext.Quotes.Find(_ => true).ToListAsync();
                var quoteResponseDTOs = quotes.Select(quote => new QuoteResponseDTO(quote)).ToList();
                return new ApiResponse<List<QuoteResponseDTO>>(quoteResponseDTOs);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<QuoteResponseDTO>>("An error occurred while retrieving all quotes.", ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId)
        {
            try
            {
                if (!ObjectId.TryParse(jobId, out ObjectId objectIdJobId))
                {
                    return new ApiResponse<List<QuoteResponseDTO>>("Invalid job ID format.");
                }

                var quotes = await _mongoHelperContext.Quotes
                    .Find(q => q.JobId == objectIdJobId)
                    .ToListAsync();

                var quoteResponseDTOs = quotes.Select(quote => new QuoteResponseDTO(quote)).ToList();
                return new ApiResponse<List<QuoteResponseDTO>>(quoteResponseDTOs);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return new ApiResponse<List<QuoteResponseDTO>>("An error occurred while retrieving the quotes by job ID.", ex.Message);
            }
        }
    }
}
