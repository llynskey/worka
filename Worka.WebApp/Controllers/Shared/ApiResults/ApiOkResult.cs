using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiOkResult : IHttpActionResult
    {
        private readonly HttpRequestMessage _request;
        private readonly bool _hasData;
        private readonly object _data;

        public ApiOkResult(HttpRequestMessage request)
            : this(request, null)
        {
            _hasData = false;
        }

        public ApiOkResult(HttpRequestMessage request, object data)
        {
            _request = request;
            _hasData = true;
            _data = data;
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            var response = _hasData ?
                _request.CreateResponse(HttpStatusCode.OK, new { data = _data, status = HttpStatusCode.OK }) :
                _request.CreateResponse(HttpStatusCode.OK, new { status = HttpStatusCode.OK });

            return await Task.FromResult(response);
        }
    }
}
