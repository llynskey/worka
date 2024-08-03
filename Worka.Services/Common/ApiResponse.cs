using System;
using System.Collections.Generic;
using Worka.Services.DTOs.Jobs;
using Worka.Services.DTOs.Quotes;

namespace Worka.Services.Common
{
    public class ApiResponse<T>
    {
        private List<QuoteResponseDTO> quoteResponseDTOs;
        private string message1;
        private QuoteResponseDTO responseDto;
        private JobResponseDTO jobResponseDTO;
        private List<JobResponseDTO> jobResponseDTOs;

        public bool Success { get; private set; }
        public string Message { get; private set; }
        public T Data { get; private set; }
        public List<string> Errors { get; private set; }
        public string Token { get; private set; }

        public ApiResponse(T data, string token, string message = null)
        {
            Success = true;
            Message = message;
            Data = data;
            Errors = new List<string>();
            Token = token;
        }

        public ApiResponse(string message)
        {
            Success = false;
            Message = message;
            Errors = new List<string>();
        }

        public ApiResponse(List<string> errors)
        {
            Success = false;
            Errors = errors;
            Message = "An error occurred.";
        }

        public ApiResponse(List<QuoteResponseDTO> quoteResponseDTOs)
        {
            this.quoteResponseDTOs = quoteResponseDTOs;
        }

        public ApiResponse(string message, string message1) : this(message)
        {
            this.message1 = message1;
        }

        public ApiResponse(QuoteResponseDTO responseDto)
        {
            this.responseDto = responseDto;
        }

        public ApiResponse(JobResponseDTO jobResponseDTO)
        {
            this.jobResponseDTO = jobResponseDTO;
        }

        public ApiResponse(List<JobResponseDTO> jobResponseDTOs)
        {
            this.jobResponseDTOs = jobResponseDTOs;
        }
    }
}
