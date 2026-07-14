using Worka.Services.Payments;
using Xunit;

namespace Worka.Tests
{
    public class ServiceFeeTests
    {
        [Theory]
        [InlineData(100, 10, 2, 10)]     // 10% of 100
        [InlineData(10, 10, 2, 2)]       // 10% would be 1, minimum 2 applies
        [InlineData(0.5, 10, 2, 2)]      // tiny quote still pays the minimum
        [InlineData(250, 10, 2, 25)]     // 10% of 250
        [InlineData(333.33, 10, 2, 33.33)] // rounded to 2 decimal places
        [InlineData(100, 0, 2, 2)]       // zero percent falls back to minimum
        public void Service_fee_is_percentage_with_minimum(
            decimal quoteAmount, decimal feePercent, decimal feeMinimum, decimal expected)
        {
            var fee = PaymentsService.CalculateServiceFee(quoteAmount, feePercent, feeMinimum);
            Assert.Equal(expected, fee);
        }

        [Fact]
        public void Fee_rounds_midpoints_away_from_zero()
        {
            // 10% of 33.35 = 3.335 -> 3.34
            var fee = PaymentsService.CalculateServiceFee(33.35m, 10m, 0m);
            Assert.Equal(3.34m, fee);
        }
    }
}
