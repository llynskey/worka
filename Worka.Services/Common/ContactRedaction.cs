using System.Text.RegularExpressions;

namespace Worka.Services.Common
{
    /// <summary>
    /// Strips contact details (emails, phone numbers, social handles) from
    /// chat messages until the job is booked with that professional, so the
    /// conversation cannot be used to take the work off-platform. Patterns
    /// stay deliberately conservative: phone matching needs at least 7 digits
    /// and skips amounts prefixed by a currency symbol, so prices like
    /// "£1200" survive untouched.
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

        public static string Redact(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text ?? string.Empty;
            }

            var result = Email.Replace(text, Placeholder);
            result = Phone.Replace(result, Placeholder);
            result = SocialContact.Replace(result, Placeholder);
            result = Handle.Replace(result, Placeholder);
            return result;
        }
    }
}
