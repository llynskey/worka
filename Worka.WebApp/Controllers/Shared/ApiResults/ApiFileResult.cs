using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Worka.WebApp.Controllers.Shared.ApiResults
{
    public class ApiFileResult : IHttpActionResult
    {
        private readonly byte[] _content;
        private readonly string _fileName;
        private readonly string _contentType;
        private readonly bool _inline;

        public ApiFileResult(byte[] content, string fileName, string contentType, bool inline)
        {
            _content = content;
            _fileName = fileName;
            _contentType = contentType;
            _inline = inline;
        }

        public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(_content) };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue(_contentType);
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue(_inline ? "inline" : "attachment") { FileName = _fileName };
            response.Content.Headers.ContentLength = _content.Length;

            return await Task.FromResult(response);
        }
    }
}
