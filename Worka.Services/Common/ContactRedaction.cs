using System.Text.RegularExpressions;

namespace Worka.Services.Common
{
    /// <summary>
    /// Strips contact details (emails, phone numbers, social handles), postal
    /// addresses (UK postcodes and street addresses) and links from chat
    /// messages until the job is booked with that professional, so the
    /// conversation cannot be used to take the work off-platform or to share
    /// the exact address before it is due. Patterns stay deliberately
    /// conservative: phone matching needs at least 7 digits and skips amounts
    /// prefixed by a currency symbol, so prices like "£1200" survive untouched.
    /// </summary>
    public static class ContactRedaction
    {
        public const string Placeholder = "[hidden until booked]";

        private static readonly Regex Email = new(
            @"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
            RegexOptions.Compiled);

        // 7+ digits allowing spaces/dashes/dots/parentheses between them,
        // with an optional leading "+" (e.g. "+44 7911 123456"). The
        // lookbehind refuses digits preceded by a currency symbol or by
        // another digit, so "£1200" and mid-number restarts never match.
        private static readonly Regex Phone = new(
            @"(?<![£$€\d])\+?\d(?:[\s\-.()]*\d){6,}",
            RegexOptions.Compiled);

        // "whatsapp: my.handle-1" style mentions. The identifier must look
        // like a handle (an @-prefix or a digit/dot/underscore in it)
        // so plain sentences like "I saw it on facebook yesterday" survive.
        private static readonly Regex SocialContact = new(
            @"\b(?:whatsapp|telegram|signal|instagram|facebook)\b[\s:\-]{0,3}(?=@|[A-Za-z0-9._\-]*[0-9._])[@A-Za-z0-9._\-]{3,}",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Standalone "@handle" mentions (emails are already gone by the
        // time this runs, so the "@" cannot belong to an address).
        private static readonly Regex Handle = new(
            @"(?<![A-Za-z0-9._])@[A-Za-z0-9_][A-Za-z0-9._]{2,}",
            RegexOptions.Compiled);

        // Links (http/https/www) — another way to move the job off-platform.
        private static readonly Regex Url = new(
            @"\b(?:https?://|www\.)\S+",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Bare domains with a common TLD, e.g. "mysite.com", "book.co.uk/x".
        // Runs after Email so it never touches an address's domain part.
        private static readonly Regex Domain = new(
            @"\b(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+(?:com|co\.uk|org\.uk|net|org|io|shop|app|site|dev|biz|info)(?:/\S*)?\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // UK postcodes, e.g. "SW1A 1AA", "M1 1AE", "B33 8TH", "CR2 6XH".
        // High precision: the letter/digit shape rarely occurs by accident.
        private static readonly Regex Postcode = new(
            @"\b[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Street addresses: a house number, up to three words, then a
        // street-type suffix — "12 Baker Street", "45 Oak Rd", "3 Elm Close".
        // The leading number + recognised suffix keeps ordinary sentences safe.
        private static readonly Regex StreetAddress = new(
            @"\b\d{1,4}[A-Za-z]?\s+(?:[A-Za-z][A-Za-z'\-]*\s+){0,3}(?:street|st|road|rd|avenue|ave|lane|ln|close|drive|dr|court|ct|crescent|cres|place|terrace|gardens|gdns|boulevard|blvd|square|walk|parade|mews|row|grove)\b\.?",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string Redact(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text ?? string.Empty;
            }

            var result = Email.Replace(text, Placeholder);
            result = Url.Replace(result, Placeholder);
            result = Domain.Replace(result, Placeholder);
            result = Phone.Replace(result, Placeholder);
            result = Postcode.Replace(result, Placeholder);
            result = StreetAddress.Replace(result, Placeholder);
            result = SocialContact.Replace(result, Placeholder);
            result = Handle.Replace(result, Placeholder);
            return result;
        }
    }
}
