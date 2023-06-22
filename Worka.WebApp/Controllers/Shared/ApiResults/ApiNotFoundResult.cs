using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiNotFoundResult : IHttpActionResult
    {
        // private readonly ILogService _logService;
        private readonly HttpRequestMessage _request;
        private readonly string _message;

        public ApiNotFoundResult(HttpRequestMessage request)
            : this(request, null)
        {
        }

        public ApiNotFoundResult(HttpRequestMessage request, string message)
        {
            _request = request;
            _message = message;

            // var container = UnityConfig.GetDefaultContainer();
            // _logService = container.Resolve<ILogService>();
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            // await _logService.LogNotFoundAsync(_message);

            var response = (_message == null) ?
                _request.CreateResponse(HttpStatusCode.NotFound, new { status = HttpStatusCode.NotFound }) :
                _request.CreateResponse(HttpStatusCode.NotFound, new { message = _message, status = HttpStatusCode.NotFound });

            return await Task.FromResult(response);
        }
    }
}
