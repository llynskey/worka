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

        /// <summary>
        /// Defence-in-depth: verify the file really is the image type its
        /// Content-Type claims by checking the magic bytes, so a renamed
        /// executable/script can't be stored as an "image".
        /// </summary>
        private static async Task<bool> LooksLikeImageAsync(IFormFile file)
        {
            var header = new byte[12];
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header, 0, header.Length);
            if (read < 4)
            {
                return false;
            }

            // JPEG: FF D8 FF
            if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return true;
            // PNG: 89 50 4E 47
            if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return true;
            // GIF: "GIF8"
            if (header[0] == (byte)'G' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'8') return true;
            // WebP: "RIFF" .... "WEBP"
            if (read >= 12
                && header[0] == (byte)'R' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F'
                && header[8] == (byte)'W' && header[9] == (byte)'E' && header[10] == (byte)'B' && header[11] == (byte)'P') return true;

            return false;
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

            if (!await LooksLikeImageAsync(file))
            {
                return BadRequest(new WorkaResponse<JobPhotoUploadResponseDTO>("The file doesn't look like a valid image."));
            }

            var uploadsRoot = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "jobs");
            Directory.CreateDirectory(uploadsRoot);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var absolutePath = Path.Combine(uploadsRoot, fileName);

            await using (var stream = System.IO.File.Create(absolutePath))
            {
                await file.CopyToAsync(stream);
            }

            // Relative URL: survives domain changes; clients resolve per-platform.
            var url = $"/api/uploads/jobs/{fileName}";
            return Ok(new WorkaResponse<JobPhotoUploadResponseDTO>(new JobPhotoUploadResponseDTO
            {
                Url = url,
                FileName = fileName,
            }));
        }

        [HttpPost("profile-photo")]
        [RequestSizeLimit(MaxJobPhotoBytes)]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile file)
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

            if (!await LooksLikeImageAsync(file))
            {
                return BadRequest(new WorkaResponse<JobPhotoUploadResponseDTO>("The file doesn't look like a valid image."));
            }

            var uploadsRoot = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "profiles");
            Directory.CreateDirectory(uploadsRoot);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var absolutePath = Path.Combine(uploadsRoot, fileName);

            await using (var stream = System.IO.File.Create(absolutePath))
            {
                await file.CopyToAsync(stream);
            }

            // Relative URL: survives domain changes; clients resolve per-platform.
            var url = $"/api/uploads/profiles/{fileName}";
            return Ok(new WorkaResponse<JobPhotoUploadResponseDTO>(new JobPhotoUploadResponseDTO
            {
                Url = url,
                FileName = fileName,
            }));
        }

        [HttpGet("profiles/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetProfilePhoto(string fileName)
        {
            return ServeUpload("profiles", fileName);
        }

        [HttpGet("jobs/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetJobPhoto(string fileName)
        {
            return ServeUpload("jobs", fileName);
        }

        private IActionResult ServeUpload(string folder, string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || fileName != Path.GetFileName(fileName))
            {
                return BadRequest();
            }

            var absolutePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", folder, fileName);
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
