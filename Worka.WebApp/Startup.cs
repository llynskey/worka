using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Worka.Services.Customers;
using Worka.Services.Database;
using Worka.Services.Interest;
using Worka.Services.Jobs;
using Worka.Services.Professionals;
using Worka.Services.Quotes;

namespace Worka.WebApp
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

                // The API is only exposed on the private Docker network. Caddy is the public edge.
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            services.AddCors(options =>
            {
                options.AddPolicy("AllowOrigin", builder =>
                {
                    builder.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            var connectionString =
                Configuration.GetConnectionString("Postgres")
                ?? Configuration["PostgresConnectionString"]
                ?? "Host=localhost;Port=5432;Database=worka;Username=worka;Password=worka";

            services.AddDbContext<WorkaDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<ICustomerService, CustomersService>();
            services.AddScoped<IProfessionalsService, ProfessionalsService>();
            services.AddScoped<IUsersService, UsersService>();
            services.AddScoped<IQuoteService, QuoteService>();
            services.AddScoped<IJobsService, JobsService>();
            services.AddScoped<IInterestRegistrationService, InterestRegistrationService>();

            services.AddAuthorization();
            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Worka API", Version = "v1" });
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseForwardedHeaders();
            EnsureDatabase(app);

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Worka API v1"));
            }

            if (!env.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }
            app.UseRouting();
            app.UseCors("AllowOrigin");
            app.UseWorkaJwt(Configuration);
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }

        private static void EnsureDatabase(IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<WorkaDbContext>();
            dbContext.Database.EnsureCreated();
        }
    }
}
