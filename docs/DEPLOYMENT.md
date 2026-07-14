# Worka Postgres Deployment

This deployment runs the Worka web app, .NET API, and PostgreSQL on the OVH VPS with Docker Compose.

## First Setup

Install Docker and the Compose plugin on the VPS, then clone the repo into `/opt/worka`.

```bash
sudo mkdir -p /opt/worka
sudo chown "$USER":"$USER" /opt/worka
git clone <your-repo-url> /opt/worka
cd /opt/worka
```

Create production environment values:

```bash
cp .env.production.example .env.production
openssl rand -hex 32
nano .env.production
```

Set both of these to the same strong database password:

- `POSTGRES_PASSWORD`
- the password segment inside `ConnectionStrings__Postgres`

Set `JwtSecret` to the generated `openssl rand -hex 32` value.

Set the Stripe values before taking real payments:

- `Stripe__SecretKey`
- `Stripe__WebhookSecret`
- `Stripe__ConnectClientId`
- `Stripe__Currency`
- `Stripe__DefaultCountry`

In Stripe, enable the payment methods you want Checkout to show, register the live domain for wallets, and point the webhook at:

```text
https://your-domain.example/api/payments/stripe/webhook
```

Apple Pay, Google Pay, browser location, and the cleanest checkout return flow all need a real HTTPS domain, not just the raw server IP over HTTP.

## Run

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f web api postgres
```

The web app is exposed on port `80`, so `http://your-server-ip/` should load the landing page. The API is private inside Docker and is proxied through the web container at `/api`, so check it with:

```bash
curl http://localhost/api/health
```

Uploaded job photos are stored in the `worka_uploads` Docker volume and served through `/api/uploads/jobs/...`.

## Backups

```bash
mkdir -p backups
docker compose --env-file .env.production exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/worka-$(date +%F).sql
```

Restore:

```bash
docker compose --env-file .env.production exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB" < backups/worka-YYYY-MM-DD.sql
```
