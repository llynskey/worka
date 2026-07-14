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
using Worka.Services.Payments;
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
            services.AddScoped<IPaymentsService, PaymentsService>();

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
            dbContext.Database.ExecuteSqlRaw("""
                ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "LocationLabel" character varying(500) NOT NULL DEFAULT '';
                ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "PhotoUrl" character varying(1000) NOT NULL DEFAULT '';
                ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "Latitude" double precision NULL;
                ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "Longitude" double precision NULL;
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "StripeAccountId" character varying(200) NOT NULL DEFAULT '';
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "StripeChargesEnabled" boolean NOT NULL DEFAULT false;
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "StripePayoutsEnabled" boolean NOT NULL DEFAULT false;
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "StripeDetailsSubmitted" boolean NOT NULL DEFAULT false;
                CREATE TABLE IF NOT EXISTS worka_payments (
                    "PaymentId" uuid PRIMARY KEY,
                    "JobId" uuid NOT NULL REFERENCES jobs("JobId") ON DELETE CASCADE,
                    "QuoteId" uuid NOT NULL REFERENCES quotes("QuoteId") ON DELETE CASCADE,
                    "CustomerId" uuid NOT NULL REFERENCES customers("CustomerId") ON DELETE CASCADE,
                    "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
                    "StripeCheckoutSessionId" character varying(200) NOT NULL DEFAULT '',
                    "StripePaymentIntentId" character varying(200) NOT NULL DEFAULT '',
                    "StripeConnectedAccountId" character varying(200) NOT NULL DEFAULT '',
                    "QuoteAmount" numeric(12,2) NOT NULL,
                    "ServiceFeeAmount" numeric(12,2) NOT NULL,
                    "TotalAmount" numeric(12,2) NOT NULL,
                    "WorkerAmount" numeric(12,2) NOT NULL,
                    "Currency" character varying(10) NOT NULL DEFAULT 'gbp',
                    "Status" character varying(40) NOT NULL DEFAULT 'pending_checkout',
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_worka_payments_StripeCheckoutSessionId"
                    ON worka_payments("StripeCheckoutSessionId")
                    WHERE "StripeCheckoutSessionId" <> '';
                """);
        }
    }
}
