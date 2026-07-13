using System;
using System.Collections.Generic;

namespace Worka.Services.Common
{
    public class WorkaResponse<T>
    {
        public bool Success { get; private set; }
        public string Message { get; private set; }
        public T Data { get; private set; }
        public List<string> Errors { get; private set; }
        public string Token { get; private set; }

        public WorkaResponse(T data, string token = null, string message = null)
        {
            Success = true;
            Message = message;
            Data = data;
            Errors = new List<string>();
            Token = token;
        }

        public WorkaResponse(string message)
        {
            Success = false;
            Message = message;
            Errors = new List<string> { message };
        }

        public WorkaResponse(string message, string detail)
        {
            Success = false;
            Message = message;
            Errors = new List<string> { detail };
        }

        public WorkaResponse(List<string> errors)
        {
            Success = false;
            Message = "An error occurred.";
            Errors = errors;
        }

        public static WorkaResponse<T> Fail(Exception exception, string message)
        {
            return new WorkaResponse<T>(message, exception.Message);
        }
    }
}
