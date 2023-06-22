using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiForbiddenResult : IHttpActionResult
    {
        // private readonly ILogService _logService;
        private readonly HttpRequestMessage _request;
        private readonly string _message;

        public ApiForbiddenResult(HttpRequestMessage request)
            : this(request, null)
        {
        }

        public ApiForbiddenResult(HttpRequestMessage request, string message)
        {
            _request = request;
            _message = message;

            // var container = UnityConfig.GetDefaultContainer();
            // _logService = container.Resolve<ILogService>();
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            // await _logService.LogUnauthorizedAsync(_message);
            var response = (_message == null) ?
                _request.CreateResponse(HttpStatusCode.Forbidden, new { status = HttpStatusCode.Forbidden }) :
                _request.CreateResponse(HttpStatusCode.Forbidden, new { message = _message, status = HttpStatusCode.Forbidden });

            return await Task.FromResult(response);
        }
    }
}
