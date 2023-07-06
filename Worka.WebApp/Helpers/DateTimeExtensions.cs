using System;

namespace API.Helpers
{
    public static class DateTimeExtensions
    {
        public static DateTime TrimMilliseconds(this DateTime date) =>
            new DateTime(date.Ticks - (date.Ticks % TimeSpan.TicksPerSecond), date.Kind);
    }
}
