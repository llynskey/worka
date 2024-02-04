using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Worka.Services.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }

        public ApiResponse(T data, string message = null)
        {
            Success = true;
            Message = message;
            Data = data;
            Errors = new List<string>();
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
    }

}
