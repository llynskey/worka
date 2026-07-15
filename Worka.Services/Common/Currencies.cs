namespace Worka.Services.Common
{
    public static class Currencies
    {
        public static readonly string[] Supported = { "gbp", "eur", "usd", "pln", "ron" };

        public static string Sanitize(string currency)
        {
            var candidate = (currency ?? string.Empty).Trim().ToLowerInvariant();
            return Supported.Contains(candidate) ? candidate : "gbp";
        }
    }
}
