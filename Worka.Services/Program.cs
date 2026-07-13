using Microsoft.Extensions.DependencyInjection;

namespace Worka.Services
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            var startup = new Startup();
            var services = new ServiceCollection();
            startup.ConfigureServices(services);
        }
    }
}
