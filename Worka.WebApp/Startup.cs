using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Worka.Services.Customers;
using Worka.Services.Database;
using Worka.Services.Email;
using Worka.Services.Interest;
using Worka.Services.Jobs;
using Worka.Services.Payments;
using Worka.Services.Professionals;
using Worka.Services.Quotes;
using Worka.Services.Reviews;

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
                    var allowedOrigins = (Configuration["Cors:AllowedOrigins"] ?? string.Empty)
                        .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                    if (allowedOrigins.Length > 0)
                    {
                        builder.WithOrigins(allowedOrigins)
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    }
                    else
                    {
                        // Production deploys serve web + API from the same origin behind Caddy,
                        // so cross-origin requests are only expected during local development.
                        builder.AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    }
                });
            });

            var connectionString =
                Configuration.GetConnectionString("Postgres")
                ?? Configuration["PostgresConnectionString"]
                ?? throw new InvalidOperationException(
                    "No Postgres connection string configured. Set ConnectionStrings__Postgres.");

            services.AddDbContext<WorkaDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<ICustomerService, CustomersService>();
            services.AddScoped<IProfessionalsService, ProfessionalsService>();
            services.AddScoped<IUsersService, UsersService>();
            services.AddScoped<IQuoteService, QuoteService>();
            services.AddScoped<IJobsService, JobsService>();
            services.AddScoped<IInterestRegistrationService, InterestRegistrationService>();
            services.AddScoped<IPaymentsService, PaymentsService>();
            services.AddSingleton<IEmailService, SmtpEmailService>();
            services.AddScoped<IReviewsService, ReviewsService>();

            var jwtSecret = Configuration["JwtSecret"];
            if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
            {
                throw new InvalidOperationException(
                    "JwtSecret is missing or too short. Provide a random secret of at least 32 characters via configuration/environment.");
            }

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateIssuerSigningKey = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(2),
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
                    };
                });

            services.AddAuthorization();

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("auth", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0
                        }));
            });

            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Worka API", Version = "v1" });
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "JWT Authorization header. Paste the token only."
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
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
            else
            {
                app.UseExceptionHandler(builder => builder.Run(async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "An unexpected error occurred. Please try again.",
                        errors = Array.Empty<string>()
                    }));
                }));

                app.UseHttpsRedirection();
            }

            app.UseRouting();
            app.UseCors("AllowOrigin");
            app.UseRateLimiter();
            app.UseAuthentication();
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
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    "TokenId" uuid PRIMARY KEY,
                    "UserId" uuid NOT NULL REFERENCES users("UserId") ON DELETE CASCADE,
                    "TokenHash" character varying(128) NOT NULL,
                    "ExpiresAt" timestamp with time zone NOT NULL,
                    "UsedAt" timestamp with time zone NULL,
                    "CreatedAt" timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_UserId"
                    ON password_reset_tokens("UserId");
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS "Phone" character varying(40) NOT NULL DEFAULT '';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS "Address" character varying(500) NOT NULL DEFAULT '';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS "Languages" character varying(200) NOT NULL DEFAULT '';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS "PhotoUrl" character varying(1000) NOT NULL DEFAULT '';
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "Languages" character varying(200) NOT NULL DEFAULT '';
                ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "PhotoUrl" character varying(1000) NOT NULL DEFAULT '';
                CREATE TABLE IF NOT EXISTS reviews (
                    "ReviewId" uuid PRIMARY KEY,
                    "JobId" uuid NOT NULL REFERENCES jobs("JobId") ON DELETE CASCADE,
                    "CustomerId" uuid NOT NULL REFERENCES customers("CustomerId") ON DELETE CASCADE,
                    "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
                    "Rating" integer NOT NULL,
                    "Comment" character varying(2000) NOT NULL DEFAULT '',
                    "CreatedAt" timestamp with time zone NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_reviews_JobId" ON reviews("JobId");
                CREATE INDEX IF NOT EXISTS "IX_reviews_ProfessionalId" ON reviews("ProfessionalId");
                -- Uploaded photo URLs were historically stored as absolute URLs,
                -- which broke when the domain changed. Convert to relative paths
                -- (idempotent: only touches rows still carrying an origin).
                UPDATE jobs SET "PhotoUrl" = regexp_replace("PhotoUrl", '^https?://[^/]+', '')
                    WHERE "PhotoUrl" LIKE 'http%' AND "PhotoUrl" LIKE '%/api/uploads/%';
                UPDATE customers SET "PhotoUrl" = regexp_replace("PhotoUrl", '^https?://[^/]+', '')
                    WHERE "PhotoUrl" LIKE 'http%' AND "PhotoUrl" LIKE '%/api/uploads/%';
                UPDATE professionals SET "PhotoUrl" = regexp_replace("PhotoUrl", '^https?://[^/]+', '')
                    WHERE "PhotoUrl" LIKE 'http%' AND "PhotoUrl" LIKE '%/api/uploads/%';
                ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "Currency" character varying(8) NOT NULL DEFAULT 'gbp';
                """);
        }
    }
}
