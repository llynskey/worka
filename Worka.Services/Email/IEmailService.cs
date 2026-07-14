namespace Worka.Services.Email
{
    public interface IEmailService
    {
        bool IsConfigured { get; }

        Task SendAsync(string toEmail, string subject, string textBody);
    }
}
