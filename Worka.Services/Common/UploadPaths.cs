using System.Text.RegularExpressions;

namespace Worka.Services.Common
{
    /// <summary>
    /// Photo URLs are only ever paths produced by our own upload endpoints.
    /// Anything else (external URLs, javascript:, absolute origins) is discarded,
    /// closing off hostile-image and tracking-pixel injection.
    /// </summary>
    public static class UploadPaths
    {
        private static readonly Regex JobPhoto = new(
            @"^/api/uploads/jobs/[A-Za-z0-9]+\.(jpg|jpeg|png|webp|gif)$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex ProfilePhoto = new(
            @"^/api/uploads/profiles/[A-Za-z0-9]+\.(jpg|jpeg|png|webp|gif)$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string SanitizeJobPhoto(string url)
        {
            var candidate = (url ?? string.Empty).Trim();
            return JobPhoto.IsMatch(candidate) ? candidate : string.Empty;
        }

        public static string SanitizeProfilePhoto(string url)
        {
            var candidate = (url ?? string.Empty).Trim();
            return ProfilePhoto.IsMatch(candidate) ? candidate : string.Empty;
        }
    }
}
