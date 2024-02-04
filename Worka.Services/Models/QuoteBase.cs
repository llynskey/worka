namespace API.Models
{
    public abstract class QuoteBase
    {
        public int Id { get; set; }
        public string ItemId { get; set; }
        public string Username { get; set; }
        public string Status { get; set; }
    }
}
