using Worka.Services.Common;
using Xunit;

namespace Worka.Tests
{
    public class ContactRedactionTests
    {
        private const string Hidden = ContactRedaction.Placeholder;

        [Theory]
        [InlineData("email me at john.doe@example.com")]
        [InlineData("call 07911 123456")]
        [InlineData("my number is +44 7911 123456")]
        [InlineData("whatsapp: handle_99")]
        [InlineData("ping @my_handle later")]
        [InlineData("the postcode is SW1A 1AA")]
        [InlineData("it's M1 1AE actually")]
        [InlineData("come to 12 Baker Street")]
        [InlineData("we're at 45 Oak Rd")]
        [InlineData("flat 3 Elm Close near the park")]
        [InlineData("book at https://booking.example.com/x")]
        [InlineData("see www.mysite.co.uk for details")]
        public void Redacts_contact_and_address_and_links(string input)
        {
            var result = ContactRedaction.Redact(input);
            Assert.Contains(Hidden, result);
        }

        [Theory]
        [InlineData("here it is: SW1A 1AA thanks", "SW1A 1AA")]
        [InlineData("come to 12 Baker Street now", "Baker Street")]
        [InlineData("book at example.com today", "example.com")]
        [InlineData("ring 1234567 anytime", "1234567")]
        public void Removes_the_sensitive_token(string input, string leaked)
        {
            Assert.DoesNotContain(leaked, ContactRedaction.Redact(input));
        }

        [Theory]
        [InlineData("the quote is £1200 total")]        // currency price survives
        [InlineData("I can come at 3 pm tomorrow")]      // time survives
        [InlineData("we need 2 rooms cleaned")]          // count + non-suffix word survives
        [InlineData("meet on the 2nd floor")]            // ordinal survives
        [InlineData("thanks, that works for me")]        // plain text survives
        public void Leaves_ordinary_text_untouched(string input)
        {
            Assert.Equal(input, ContactRedaction.Redact(input));
        }
    }
}
