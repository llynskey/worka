using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
        public MongoHelperContext _mongoHelperContext { get; set; }
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

                var responseDto = new QuoteResponseDTO
                {
                    QuoteId = quote.QuoteId.ToString(),
                    ProfessionalId = quote.ProfessionalId.ToString(),
                    Price = quote.Price
                };

                return new ApiResponse<QuoteResponseDTO>(responseDto);
            }
            catch (Exception ex)
            {
                return new ApiResponse<QuoteResponseDTO>(ex.Message);
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

                var jobIds = await _mongoHelperContext.Jobs.Find(j => j.CustomerId == objectIdCustomerId)
                .Project(j => j.AcceptedQuoteId) // This projects the results to only include the AcceptedQuoteId field
                .ToListAsync(); // This executes the query asynchronously and converts the results to a List

                var quotes = await _mongoHelperContext.Quotes.Find(q => jobIds.Contains(q.QuoteId)).ToListAsync();

                var responseDtos = quotes.Select(q => new QuoteResponseDTO
                {
                    // Map properties from Quote to QuoteResponseDTO here
                    
                }).ToList();

                return new ApiResponse<List<QuoteResponseDTO>>(responseDtos);
            }
            catch (Exception ex)
            {
                // Log the exception details here if necessary
                return new ApiResponse<List<QuoteResponseDTO>>(ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByProfessionalIdAsync(string professionalId)
        {
            try
            {
                var quotes = await _mongoHelperContext.Quotes.Find(q => q.ProfessionalId.ToString() == professionalId).ToListAsync();

                var responseDtos = quotes.Select(q => new QuoteResponseDTO
                {
                    // Map properties from each quote
                }).ToList();

                return new ApiResponse<List<QuoteResponseDTO>>(responseDtos);
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<QuoteResponseDTO>>(ex.Message);
            }
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetAllQuotes()
        {
            var quotes = await _mongoHelperContext.Quotes.Find(_ => true).ToListAsync();
            var quoteResponseDTOs = quotes.Select(quote => new QuoteResponseDTO
            {
                QuoteId = quote.QuoteId.ToString(),
                ProfessionalId = quote.ProfessionalId.ToString(),
                Price = quote.Price
            }).ToList();

            return new ApiResponse<List<QuoteResponseDTO>>(quoteResponseDTOs);
        }

        public async Task<ApiResponse<List<QuoteResponseDTO>>> GetQuotesByJobIdAsync(string jobId)
        {
            var quotes = await _mongoHelperContext.Quotes.Find(q => q.JobId.ToString() == jobId).ToListAsync();
            var quoteResponseDTOs = quotes.Select(quote => new QuoteResponseDTO
            {
                QuoteId = quote.QuoteId.ToString(),
                ProfessionalId = quote.ProfessionalId.ToString(),
                Price = quote.Price
            }).ToList();

            return new ApiResponse<List<QuoteResponseDTO>>(quoteResponseDTOs);
        }
    }
}
