namespace Worka.Services.DTOs.Users
{
    public class ChangePasswordDTO
    {
        public string CurrentPassword { get; set; } = string.Empty;

        public string NewPassword { get; set; } = string.Empty;
    }

    public class DeleteAccountDTO
    {
        public string Password { get; set; } = string.Empty;
    }

    public class ForgotPasswordDTO
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDTO
    {
        public string Token { get; set; } = string.Empty;

        public string NewPassword { get; set; } = string.Empty;
    }
}
