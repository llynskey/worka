using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Worka.Services.Email
{
    /// <summary>
    /// Generic SMTP email sender. Configure via:
    /// Smtp:Host, Smtp:Port (default 587), Smtp:Username, Smtp:Password,
    /// Smtp:From (default no-reply@woka.site), Smtp:UseSsl (default true).
    /// When Smtp:Host is not configured, IsConfigured is false and sends are skipped.
    /// </summary>
    public class SmtpEmailService : IEmailService
    {
        private readonly string _host;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password;
        private readonly string _from;
        private readonly bool _useSsl;

        public SmtpEmailService(IConfiguration configuration)
        {
            _host = configuration["Smtp:Host"] ?? string.Empty;
            _port = int.TryParse(configuration["Smtp:Port"], out var port) ? port : 587;
            _username = configuration["Smtp:Username"] ?? string.Empty;
            _password = configuration["Smtp:Password"] ?? string.Empty;
            _from = configuration["Smtp:From"] ?? "no-reply@woka.site";
            _useSsl = !string.Equals(configuration["Smtp:UseSsl"], "false", StringComparison.OrdinalIgnoreCase);
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_host);

        public async Task SendAsync(string toEmail, string subject, string textBody)
        {
            if (!IsConfigured)
            {
                return;
            }

            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl = _useSsl,
                Credentials = string.IsNullOrWhiteSpace(_username)
                    ? null
                    : new NetworkCredential(_username, _password)
            };

            using var message = new MailMessage(_from, toEmail, subject, textBody);
            await client.SendMailAsync(message);
        }
    }
}
