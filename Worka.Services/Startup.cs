using Microsoft.Extensions.DependencyInjection;

namespace Worka.Services
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Setup MongoDB connection
            var connectionString = "mongodb+srv://root:toor@worka.bcgzcvw.mongodb.net/?retryWrites=true&w=majority";
            var settings = MongoClientSettings.FromConnectionString(connectionString);

            var client = new MongoClient(settings);
            var database = client.GetDatabase("Worka");

            services.AddSingleton(provider =>
            {
                var mongoHelperContext = new MongoHelperContext(database);
                return mongoHelperContext;
            });
        }
    }
}