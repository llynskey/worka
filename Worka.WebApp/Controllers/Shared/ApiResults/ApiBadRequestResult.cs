using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using Worka.Services.ServiceModels;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiBadRequestResult : IHttpActionResult
    {
        private readonly HttpRequestMessage _request;
        private readonly string _message;
        private readonly object _data;
        private readonly List<ValidationErrorModel> _listModels;
        private readonly IDictionary<string, string> _errors;

        public ApiBadRequestResult(HttpRequestMessage request)
        {
            _request = request;
        }

        public ApiBadRequestResult(HttpRequestMessage request, string message)
        {
            _request = request;
            _message = message;
        }
        public ApiBadRequestResult(HttpRequestMessage request, string message, object data)
        {
            _request = request;
            _message = message;
            _data = data;
        }

        public ApiBadRequestResult(HttpRequestMessage request, List<ValidationErrorModel> listModels)
        {
            _request = request;
            _listModels = listModels;
        }

        public ApiBadRequestResult(HttpRequestMessage request, IDictionary<string, string> errors)
        {
            _request = request;
            _errors = errors;
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            object responseData;

            if (_errors != null)
            {
                responseData = new { status = HttpStatusCode.BadRequest, errors = _errors };
            }
            else if (_message != null)
            {
                responseData = new { status = HttpStatusCode.BadRequest, message = _message };

                if (_data != null)
                {
                    responseData = new { status = HttpStatusCode.BadRequest, message = _message, data = _data };
                }
            }
            else if (_listModels != null)
            {
                responseData = new { status = HttpStatusCode.BadRequest, errorsList = _listModels };
            }
            else
            {
                responseData = new { status = HttpStatusCode.BadRequest };
            }

            var response = _request.CreateResponse(HttpStatusCode.BadRequest, responseData);

            return await Task.FromResult(response);
        }
    }
}
