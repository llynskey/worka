using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiExceptionResult : IHttpActionResult
    {
        // private readonly ILogService _logService;
        private readonly HttpRequestMessage _request;
        private readonly Exception _exception;

        public ApiExceptionResult(HttpRequestMessage request, Exception exception)
        {
            _request = request;
            _exception = exception;

            // var container = UnityConfig.GetDefaultContainer();
            // _logService = container.Resolve<ILogService>();
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            // await _logService.LogExceptionAsync(_exception);
            var response = _request.CreateResponse(HttpStatusCode.InternalServerError, new { _exception.Message, _exception.StackTrace });
            return await Task.FromResult(response);
        }
    }
}
