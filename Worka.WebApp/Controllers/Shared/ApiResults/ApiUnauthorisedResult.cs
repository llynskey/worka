using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiUnauthorizedResult : IHttpActionResult
    {
        // private readonly ILogService _logService;
        private readonly HttpRequestMessage _request;
        private readonly string _message;

        public ApiUnauthorizedResult(HttpRequestMessage request)
            : this(request, null)
        {
        }

        public ApiUnauthorizedResult(HttpRequestMessage request, string message)
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
                _request.CreateResponse(HttpStatusCode.Unauthorized, new { status = HttpStatusCode.Unauthorized }) :
                _request.CreateResponse(HttpStatusCode.Unauthorized, new { message = _message, status = HttpStatusCode.Unauthorized });

            return await Task.FromResult(response);
        }
    }
}
