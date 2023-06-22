using System;
using System.Collections.Generic;
using System.Web.Http;
using Worka.Services.ServiceModels;
using Worka.WebApp.Controllers.Shared.ApiResults;

namespace Worka.WebApp.Controllers
{
    public class BaseController : ApiController
    {
        // DB Context
        //put db context here

        //[Dependency]
       // protected Lazy<IXenonContext> LazyDb { get; set; }

        // Request Validation
        private IDictionary<string, string> _badRequestErrors;

        public IDictionary<string, string> BadRequestErrors => _badRequestErrors ?? (_badRequestErrors = new Dictionary<string, string>());

        public void AddBadRequestError(string key, string message)
        {
            //Don't add duplicate errors for same key
            if (!BadRequestErrors.ContainsKey(key))
            {
                BadRequestErrors.Add(key, message);
            }
        }

        public void AddBadRequestErrors(IEnumerable<ValidationError> validationErrors, string overrideKey = null)
        {
            if (validationErrors != null)
            {
                foreach (var validationError in validationErrors)
                {
                    AddBadRequestError(overrideKey ?? validationError.FieldName, validationError.ErrorMessage);
                }
            }
        }


        // API Responses
        public IHttpActionResult ApiException(Exception e)
        {
            return new ApiExceptionResult(Request, e);
        }

        public IHttpActionResult ApiNotFound(string message)
        {
            return new ApiNotFoundResult(Request, message);
        }

        public IHttpActionResult ApiNotFound()
        {
            return new ApiNotFoundResult(Request);
        }

        public IHttpActionResult ApiBadRequest(string message)
        {
            return new ApiBadRequestResult(Request, message);
        }

        public IHttpActionResult ApiBadRequest(string message, object data)
        {
            return new ApiBadRequestResult(Request, message, data);
        }

        public IHttpActionResult ApiBadRequest(List<ValidationErrorModel> listModels)
        {
            return new ApiBadRequestResult(Request, listModels);
        }

        public IHttpActionResult ApiBadRequest()
        {
            return new ApiBadRequestResult(Request, _badRequestErrors);
        }

        public IHttpActionResult ApiOk(object data)
        {
            return new ApiOkResult(Request, data);
        }

        public IHttpActionResult ApiOk()
        {
            return new ApiOkResult(Request);
        }

        public IHttpActionResult ApiFileOk(byte[] content, string fileName, string contentType, bool inline = false)
        {
            return new ApiFileResult(content, fileName, contentType, inline);
        }

        public IHttpActionResult ApiUnauthorized()
        {
            return new ApiUnauthorizedResult(Request);
        }

        public IHttpActionResult ApiUnauthorized(string message)
        {
            return new ApiUnauthorizedResult(Request, message);
        }

        public IHttpActionResult ApiForbidden()
        {
            return new ApiForbiddenResult(Request);
        }

        public IHttpActionResult ApiForbidden(string message)
        {
            return new ApiForbiddenResult(Request, message);
        }

    }
}
