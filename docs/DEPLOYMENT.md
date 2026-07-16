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

## HTTPS

Domains are configured in `deploy/Caddyfile` (currently `fixa.site`, `www.fixa.site`, and `api.fixa.site`). Point DNS `A` records for all three at the VPS IPv4 address. The `api.` subdomain is what the native iOS/Android apps call; web traffic stays same-origin through `/api`.

Make sure ports `80` and `443` are open in the VPS firewall and any OVH network firewall. Caddy will request and renew Let's Encrypt certificates automatically. Certificate data is stored in the `caddy_data` Docker volume, so it survives rebuilds.

Keep `SITE_ADDRESS=:80` only while testing on a raw IP address without DNS.

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

## Email (password resets)

Create a free account with an SMTP provider (Brevo: 300 emails/day free, or SMTP2GO: 1,000/month free), verify your sending domain with the DNS records they give you (SPF + DKIM), then set in `.env.production`:

```bash
Smtp__Host=smtp-relay.brevo.com    # or your provider's host
Smtp__Port=587
Smtp__Username=<from provider>
Smtp__Password=<from provider>
Smtp__From=no-reply@fixa.site
```

Restart the api container and confirm `https://fixa.site/api/health` reports `"email": "configured"`. Do NOT run your own mail server on the VPS — OVH blocks port 25 by default and a fresh IP has no sending reputation, so resets would land in spam.

## Automatic deployment (GitHub Actions)

Every green build on `master` deploys itself once these repo secrets are set (GitHub → Settings → Secrets and variables → Actions):

- `VPS_HOST` — the VPS IP or hostname
- `VPS_USER` — the SSH user that owns /opt/worka
- `VPS_SSH_KEY` — a private key whose public half is in that user's `~/.ssh/authorized_keys` (generate a dedicated one: `ssh-keygen -t ed25519 -f worka-deploy -N ""`)

The deploy job pulls master into /opt/worka, rebuilds the containers against `.env.production`, and hits the health endpoint. Manual deploys still work the same way by SSHing in and running the Run commands below.

## Run

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f web api postgres
```

The web app is exposed on ports `80` and `443`. With `SITE_ADDRESS=:80`, `http://your-server-ip/` should load the landing page. With a real domain, `https://your-domain.example/` should load it and HTTP should redirect to HTTPS. The API is private inside Docker and is proxied through the web container at `/api`, so check it with:

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
