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

## Email (self-hosted mail server)

The stack runs its own mail server (`mailserver` service — docker-mailserver: Postfix + Dovecot + OpenDKIM). It sends the app's transactional email and hosts real mailboxes you can log into over IMAP:

- `no-reply@fixa.site` — the API's sending account
- `support@fixa.site` — general inbox (`postmaster@` and `abuse@` alias here)
- `pros@fixa.site` — professional-facing inbox

Mailboxes, aliases and the DKIM key are **provisioned automatically on first boot** by `deploy/mail/user-patches.sh` from the `MAIL_*_PASSWORD` values in `.env.production`. The API is already wired to relay through the container (`Smtp__Host=mail.fixa.site`, port 587 STARTTLS, authenticating as `no-reply@fixa.site`). So the container side is "pull + build + up".

What **cannot** be automated (do these once, by hand):

**1. Set the mailbox passwords** in `.env.production`:

```bash
MAIL_NOREPLY_PASSWORD=...
MAIL_SUPPORT_PASSWORD=...
MAIL_PROS_PASSWORD=...
```

**2. DNS records** (at your registrar). Bring the stack up once so the DKIM key exists, then run the helper to get every value to paste:

```bash
docker compose --env-file .env.production up -d --build
./deploy/mail/print-dns.sh
```

It prints, for `fixa.site`:

| Type | Name | Value |
|------|------|-------|
| A | `mail` | your server IPv4 |
| MX | `@` | `10 mail.fixa.site.` |
| TXT | `@` | `v=spf1 mx ~all` |
| TXT | `mail._domainkey` | the DKIM public key it prints |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@fixa.site; adkim=s; aspf=s` |

**3. Reverse DNS (PTR)** — in the **OVH** panel, set the PTR for the VPS IP to `mail.fixa.site`. Gmail/Outlook reject mail whose PTR doesn't match.

**4. Outbound port 25** — confirm OVH allows outbound TCP 25 from the VPS (open a support ticket if it's throttled/blocked); receiving also needs inbound `25`, and mail apps need `587`, `465`, `993` open in the VPS/OVH firewall.

**TLS:** the container serves TLS using the `mail.fixa.site` certificate that Caddy obtains (see the `mail.fixa.site` block in `deploy/Caddyfile`) and reads it from the shared `caddy_data` volume. On the very first boot the mailserver may restart a few times until Caddy has issued that cert — that's expected. This needs the `mail` A record (step 2) in place first.

**Verify:**

```bash
curl http://localhost/api/health          # expect "email": "configured"
dig MX fixa.site +short
dig TXT mail._domainkey.fixa.site +short
```

Then send a test to <https://www.mail-tester.com> and aim for 10/10 before relying on resets.

**Mail apps (IMAP/SMTP):** server `mail.fixa.site`, IMAP `993` (SSL) or `143` (STARTTLS), SMTP `587` (STARTTLS), username = the full email address, password = the `MAIL_*_PASSWORD` you set.

> Prefer not to self-host? Set `Smtp__Host` to an external relay (Brevo/SMTP2GO) in `.env.production`, add their SPF/DKIM records, and you can remove the `mailserver` service. Self-hosting from a fresh IP means deliverability depends entirely on PTR + SPF/DKIM/DMARC being correct.

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
