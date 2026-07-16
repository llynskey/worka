# Fixa demo seed

Populates the database with a realistic demo dataset across UK & France so the
map, job lists, quotes, messages and reviews look alive.

**Contents (~778 rows):** 18 professionals, 24 customers, 120 jobs (open /
booked / completed / cancelled), 232 quotes, 46 payments, 19 reviews, 277
messages. Every seeded account is under `@seed.fixa.site`.

## Demo logins
Any seeded address, password **`FixaDemo123!`**. For example:
- Professional — `pro.jack.brown0@seed.fixa.site`
- Customer — `cust.henry.thomas0@seed.fixa.site`

(Browse `seed.sql` for the full list.)

## Apply (production)

> Run **once**. It's wrapped in a transaction, so `ON_ERROR_STOP=1` makes any
> problem roll the whole thing back — nothing is half-applied. Substitute your
> real DB user/name (the `POSTGRES_USER` / `POSTGRES_DB` from `.env.production`).

```bash
cd /opt/worka

# 1. Back up first (always, before touching prod data)
docker compose --env-file .env.production exec -T postgres \
  pg_dump -U worka worka > backups/pre-seed-$(date +%F).sql

# 2. Apply the seed
docker compose --env-file .env.production exec -T postgres \
  psql -U worka -d worka -v ON_ERROR_STOP=1 < seed/seed.sql

# 3. Sanity check
docker compose --env-file .env.production exec -T postgres \
  psql -U worka -d worka -c "select count(*) from jobs where \"CustomerId\" in (select \"CustomerId\" from customers where \"Email\" like '%@seed.fixa.site');"
```

## Remove everything later
```bash
docker compose --env-file .env.production exec -T postgres \
  psql -U worka -d worka -v ON_ERROR_STOP=1 < seed/cleanup.sql
```
This deletes only rows under `@seed.fixa.site` (and their jobs/quotes/payments/
reviews/messages). Real data is untouched.

## Regenerate
`seed.sql` / `cleanup.sql` are generated and deterministic:
```bash
cd seed && python3 generate_seed.py
```
Edit counts or content in `generate_seed.py` / `seed_data.py` and re-run.
`create_test_schema.sql` is only for validating the SQL against a scratch
Postgres; it is not used in production.

## Notes
- Passwords use the app's exact PBKDF2-SHA256 (100k iterations) so the demo
  logins work through the normal login flow.
- Jobs carry real (jittered) coordinates so they populate the map; professionals
  see approximate pins until a job is booked, exactly like real data.
- Some seeded messages deliberately contain phone numbers / emails / addresses /
  links so the pre-booking contact redaction is visible in the threads.
