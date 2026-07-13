# Worka Postgres Deployment

This deployment runs the Worka .NET API and PostgreSQL on the OVH VPS with Docker Compose.

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

## Run

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f api postgres
```

The API is exposed on port `5000` of the VPS. Put Caddy/Nginx or your provider firewall in front of that for a public domain.

## Backups

```bash
mkdir -p backups
docker compose --env-file .env.production exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/worka-$(date +%F).sql
```

Restore:

```bash
docker compose --env-file .env.production exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB" < backups/worka-YYYY-MM-DD.sql
```
