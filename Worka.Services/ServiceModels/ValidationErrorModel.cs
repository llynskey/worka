namespace Worka.Services.ServiceModels
{
    public class ValidationErrorModel
    {
        public string ItemId { get; set; }
        public IDictionary<string, string> ItemErrors { get; set; }
    }
}
