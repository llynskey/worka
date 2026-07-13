using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace Worka.WebApp
{
    public static class WorkaJwtMiddleware
    {
        public static IApplicationBuilder UseWorkaJwt(this IApplicationBuilder app, IConfiguration configuration)
        {
            return app.Use(async (context, next) =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var token = authHeader["Bearer ".Length..].Trim();
                    var secret = configuration.GetRequiredSection("JwtSecret").Value;

                    if (!string.IsNullOrWhiteSpace(secret))
                    {
                        try
                        {
                            var principal = new JwtSecurityTokenHandler().ValidateToken(
                                token,
                                new TokenValidationParameters
                                {
                                    ValidateIssuer = false,
                                    ValidateAudience = false,
                                    ValidateIssuerSigningKey = true,
                                    ValidateLifetime = true,
                                    ClockSkew = TimeSpan.FromMinutes(2),
                                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
                                },
                                out _);

                            context.User = principal;
                        }
                        catch
                        {
                            context.User = new System.Security.Claims.ClaimsPrincipal();
                        }
                    }
                }

                await next();
            });
        }
    }
}
