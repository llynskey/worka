using System.Text.RegularExpressions;

namespace Worka.Services.Common
{
    /// <summary>
    /// Professionals only see the exact place of work once a job is booked
    /// and paid. Before that they get the area: house number/street stripped,
    /// UK postcodes reduced to their outward code, and map coordinates
    /// rounded to ~1 km so quoting on travel distance still works.
    /// </summary>
    public static class LocationPrivacy
    {
        // "NW1 8QL" -> "NW1"; matches full UK postcodes anywhere in the string.
        private static readonly Regex FullPostcode = new(
            @"\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string MaskAddress(string address)
        {
            var value = (address ?? string.Empty).Trim();
            if (value.Length == 0)
            {
                return value;
            }

            // Drop the first comma-separated segment (street + house number)
            // when there is anything else to show.
            var segments = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var area = segments.Length > 1
                ? string.Join(", ", segments.Skip(1))
                : value;

            return FullPostcode.Replace(area, "$1").Trim();
        }

        public static double? BlurCoordinate(double? value)
        {
            // Two decimal places ≈ 1.1 km — enough to judge travel, not enough
            // to knock on the door.
            return value.HasValue ? Math.Round(value.Value, 2) : value;
        }
    }
}
