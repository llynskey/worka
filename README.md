# Fixa

Fixa is a two-sided home-services marketplace for customers and local professionals, running on web, iOS, and Android from a single Expo codebase with a .NET 8 + PostgreSQL API.

Customers post jobs, compare quotes, and pay to book through Stripe. Professionals build a profile, browse open jobs (list and map), send quotes, and get paid out via Stripe Connect. Fixa takes a configurable service fee on every paid booking (default 10%, minimum £2).

## Architecture

- `Worka.WebApp` — ASP.NET Core (net8.0) API. JWT bearer authentication, rate limiting on auth endpoints, Swagger in development.
- `Worka.Services` — domain services, EF Core (Npgsql) data layer, Stripe Connect payments.
- `Worka.Tests` — xUnit tests for auth, job/quote authorization rules, and service-fee calculation.
- `Worka.WebApp/client` — Expo SDK 54 / React Native app (web + iOS + Android).
- `docker-compose.yml` + `deploy/Caddyfile` — production stack: Caddy edge (auto-HTTPS), API, PostgreSQL 16.

### Feature surface

Customers: post, edit, delete, and complete jobs; browse and filter professionals by trade, area, and typical price; compare quotes; pay and book through Stripe Checkout. Professionals: browse jobs (list + map), send, edit, and withdraw quotes; Stripe Connect payouts. Both: change password, forgot/reset password by email, delete account in-app (App Store requirement), language selection (English, Spanish, French, Romanian — see Internationalisation below).

### Security model

All job and quote endpoints require a valid JWT; the acting customer/professional is derived from the token, never from the request body. Booking happens exclusively through Stripe Checkout (`/api/payments/...`), confirmed by webhook. Passwords are PBKDF2-SHA256 (100k iterations). Secrets are supplied via environment variables only — nothing sensitive is committed.

> **Note:** the previous JWT signing secret and database password were committed to git history. They have been removed from the source, but you must treat them as compromised: generate a fresh `JwtSecret` and database password for production (existing sessions will be signed out).

## Run locally

### API

Requires a local PostgreSQL (`worka`/`worka` on port 5432, matching `appsettings.Development.json`, or run `docker compose up postgres`).

```powershell
dotnet run --project Worka.WebApp/Worka.WebApp.csproj
```

Swagger: `https://localhost:5001/swagger`.

### Client

```powershell
cd Worka.WebApp/client
npm install
npm run web        # web
npm start          # iOS / Android via Expo
```

Set `EXPO_PUBLIC_API_URL` to point the client at a non-defaul