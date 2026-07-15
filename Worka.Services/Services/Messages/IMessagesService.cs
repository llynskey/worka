using Worka.Services.Common;
using Worka.Services.DTOs.Messages;

namespace Worka.Services.Messages
{
    public interface IMessagesService
    {
        Task<WorkaResponse<List<JobMessageDTO>>> GetThreadAsync(string userId, string jobId, string professionalId = null);
        Task<WorkaResponse<JobMessageDTO>> SendAsync(string userId, string jobId, string professionalId, string body);
    }
}
