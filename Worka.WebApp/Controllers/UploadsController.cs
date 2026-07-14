using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;
using Worka.Services.Common;
using Worka.Services.DTOs.Uploads;

namespace Worka.WebApp.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private const long MaxJobPhotoBytes = 8 * 1024 * 1024;
        private static readonly Dictionary<string, string> AllowedImageTypes = new()
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp",
            ["image/gif"] = ".gif",
        };

        private readonly IWebHostEnvironment _environment;

        public UploadsController(IWebHostEnvironment environment)
        {
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        }

        [HttpPost("job-photo")]
        [RequestSizeLimit(MaxJobPhotoBytes)]
        public async Task<IActionResult> UploadJobPhoto(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new WorkaResponse<JobPhotoUploadResponseDTO>("Choose an image to upload."));
            }

            if (file.Length > MaxJobPhotoBytes)
            {
                return BadRequest(new WorkaResponse<JobPhotoUploadResponseDTO>("Images must be 8MB or smaller."));
            }

            if (!AllowedImageTypes.TryGetValue(file.ContentType.ToLowerInvariant(), out var extension))
            {
                return BadRequest(new WorkaResponse<JobPhotoUploadResponseDTO>("Use a JPG, PNG, WebP, or GIF image."));
            }

            var uploadsRoot = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "jobs");
            Directory.CreateDirectory(uploadsRoot);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var absolutePath = Path.Combine(uploadsRoot, fileName);

            await using (var stream = System.IO.File.Create(absolutePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/api/uploads/jobs/{fileName}";
            return Ok(new WorkaResponse<JobPhotoUploadResponseDTO>(new JobPhotoUploadResponseDTO
            {
                Url = url,
                FileName = fileName,
            }));
        }

        [HttpGet("jobs/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetJobPhoto(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || fileName != Path.GetFileName(fileName))
            {
                return BadRequest();
            }

            var absolutePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "jobs", fileName);
            if (!System.IO.File.Exists(absolutePath))
            {
                return NotFound();
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "application/octet-stream",
            };

            return PhysicalFile(absolutePath, contentType);
        }
    }
}
