using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Worka.Services.Database;

namespace Worka.Services
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
                ?? "Host=localhost;Port=5432;Database=worka;Username=worka;Password=worka";

            services.AddDbContext<WorkaDbContext>(options => options.UseNpgsql(connectionString));
        }
    }
}
