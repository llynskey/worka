# Worka

Worka is a two-sided home-services marketplace for customers and local professionals.

Customers can create an account, post jobs, compare quotes, and accept a quote. Professionals can create a profile, browse open jobs, send quotes, and track bid outcomes.

## Product Surface

- Customer workspace with job pipeline, quote stats, quote review, and booking action.
- Professional workspace with available jobs, quote submission, and bid tracking.
- Public black-and-white expat/language landing page with interest registration.
- Account/profile management for both customers and professionals.
- JWT-backed authentication with role-based app routing.
- MongoDB-backed users, customer profiles, professional profiles, jobs, and quotes.
- MongoDB-backed interest registrations for pre-launch demand capture, language demand, and location signals.
- Expo client that runs on mobile and web.
- Swagger-enabled .NET API for local development.
- Production Docker Compose deployment for VPS hosting with Caddy, the API, and MongoDB.

## Run Locally

### API

```powershell
dotnet run --project Worka.WebApp/Worka.WebApp.csproj
```

The API runs from the launch profile on:

- `http://localhost:5000`
- `https://localhost:5001`

By default the API uses local MongoDB at `mongodb://localhost:27017` with database `Worka`.

### Client

```powershell
cd Worka.WebApp/client
npm run web
```

For mobile Expo development:

```powershell
cd Worka.WebApp/client
npm start
```

Set `EXPO_PUBLIC_API_URL` when the client should point somewhere other than the default API URL.

## Environment

Backend configuration keys:

- `JwtSecret`
- `MongoDatabaseName`
- `ConnectionStrings:MongoDb`

Client configuration keys:

- `EXPO_PUBLIC_API_URL`

## Business Model

Worka is positioned to monetize through:

- Service fees on accepted and paid quotes.
- Stripe Connect application fees on marketplace payments.
- Professional subscriptions for higher lead volume and profile placement.
- Customer convenience fees for managed booking or urgent jobs.
- Future add-ons such as insurance, dispute handling, and payment protection.

## Production Hosting

Use the Docker Compose VPS setup in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Verification

The current codebase has been verified with:

```powershell
dotnet build Worka.sln
cd Worka.WebApp/client
npm run typecheck
npx expo export --platform web
```

The .NET build currently reports a NuGet advisory warning for `System.IdentityModel.Tokens.Jwt` 6.32.1. Upgrade that package before production release.
