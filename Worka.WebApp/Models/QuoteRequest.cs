namespace API.Models
{
    public class QuoteRequest : QuoteBase
    {
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string AddressLine3 { get; set; }
        public string City { get; set; }
        public string Region { get; set; }
        public string PostCode { get; set; }
    }
}
