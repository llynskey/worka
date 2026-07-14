# Worka

Worka is a two-sided home-services marketplace for customers and local professionals, running on web, iOS, and Android from a single Expo codebase with a .NET 8 + PostgreSQL API.

Customers post jobs, compare quotes, and pay to book through Stripe. Professionals build a profile, browse open jobs (list and map), send quotes, and get paid out via Stripe Connect. Worka takes a configurable service fee on every paid booking (default 10%, minimum £2).

## Architecture

- `Worka.WebApp` — ASP.NET Core (net8.0) API. JWT bearer authentication, rate limiting on auth endpoints, Swagger in development.
- `Worka.Services` — domain services, EF Core (Npgsql) data layer, Stripe Connect payments.
- `Worka.Tests` — xUnit tests for auth, job/quote authorization rules, and service-fee calculation.
- `Worka.WebApp/client` — Expo SDK 54 / React Native app (web + iOS + Android).
- `docker-compose.yml` + `deploy/Caddyfile` — production stack: Caddy edge (auto-HTTPS), API, PostgreSQL 16.

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

Set `EXPO_PUBLIC_API_URL` to point the client at a non-default API (defaults: `/api` on web, `https://api.worka-uk.online` on native).

### Tests

```powershell
dotnet test Worka.Tests/Worka.Tests.csproj
cd Worka.WebApp/client
npm run typecheck
```

CI (GitHub Actions, `.github/workflows/ci.yml`) builds the solution, runs the tests, typechecks, and exports the web bundle on every push and PR.

## Configuration

Backend (environment variables in production, `appsettings.Development.json` locally):

| Key | Purpose |
| --- | --- |
| `JwtSecret` | JWT signing key, ≥32 random chars (`openssl rand -hex 32`). Required — startup fails without it. |
| `ConnectionStrings__Postgres` | PostgreSQL connection string. Required. |
| `Stripe__SecretKey`, `Stripe__WebhookSecret` | Stripe API + webhook signing secrets. |
| `Stripe__Currency`, `Stripe__DefaultCountry` | Default `gbp` / `GB`. |
| `Worka__ServiceFeePercent`, `Worka__ServiceFeeMinimum` | Marketplace fee (default 10 / 2). |
| `Cors__AllowedOrigins` | Comma-separated origins. Leave unset for same-origin deploys behind Caddy. |

Client:

| Key | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Optional Mapbox geocoding token (falls back to Nominatim). |

## Production deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Summary: point DNS `A` records for `worka-uk.online`, `www.worka-uk.online`, and `api.worka-uk.online` at the VPS, fill in `.env.production`, then `docker compose --env-file .env.production up -d --build`. Caddy handles HTTPS automatically. The `api.` subdomain serves native mobile apps; web traffic uses same-origin `/api`.

Stripe: point the webhook at `https://worka-uk.online/api/payments/stripe/webhook` (event: `checkout.session.completed`) and set `Stripe__WebhookSecret` from the webhook signing secret.

## Store submission

`app.json` carries bundle IDs (`com.llynskey.worka`), icons, and splash. `eas.json` has production build profiles with `autoIncrement`; fill in the placeholder Apple/Google credentials in the `submit.production` section, then:

```powershell
cd Worka.WebApp/client
npx eas build --platform all --profile production
npx eas submit --platform ios
npx eas submit --platform android
```

Both stores require a hosted privacy policy URL and app screenshots before review.

## Launch checklist

1. Rotate `JwtSecret` and the PostgreSQL password (old values were in git history).
2. Set live Stripe keys and register the webhook; complete Stripe platform profile for Connect.
3. Point DNS for apex, `www`, and `api` subdomains; confirm `https://worka-uk.online/api/health` returns `{"status":"ok"}`.
4. Run a real end-to-end booking with a live card and confirm the payout split in Stripe.
5. Set up database backups (see DEPLOYMENT.md) on a cron schedule.
6. Fill in EAS submit credentials and ship the iOS/Android builds.

## Business model

- Service fee on every paid booking (Stripe application fee on destination charges).
- Future: professional subscriptions, promoted placement, urgent-job convenience fees, payment protection.

## Known limitations / next steps

- Schema is managed by `EnsureCreated` + idempotent SQL at startup; move to EF Core migrations before the schema evolves further.
- Job photos are stored on a Docker volume; move to object storage (S3/R2) as volume grows.
- No push notifications, in-app messaging, or reviews yet — highest-value features to add next.
