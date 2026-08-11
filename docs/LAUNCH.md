# Worku — launch runbook

The one-time checklist to go from "deployed" to "safe with real users".
Everything here is server/dashboard/DNS work — the code side is done and
covered by CI (`dotnet test` 76 tests + Playwright E2E in `e2e/`).

## 1. Flip the environment to production posture

In `/opt/worka/.env.production`:

- [ ] `Dev__AllowSeed` — remove it or set `false` (the sample-data endpoint 404s when off)
- [ ] Web build arg `EXPO_PUBLIC_ALLOW_SEED` — remove/false (hides the "Load sample data" button)
- [ ] `JwtSecret` — long random value, not reused anywhere
- [ ] `Cors__AllowedOrigins` — defaults to `https://worku.site` now; add other origins only if needed

Then rebuild everything once: `docker compose --env-file .env.production up -d --build`

## 2. Stripe: switch to live mode

- [ ] Replace `Stripe__SecretKey` with the **live** key (`sk_live_…`)
- [ ] In the Stripe dashboard, create a **live** webhook endpoint pointing at
      `https://worku.site/api/payments/stripe/webhook` (or the api.worku.site route),
      subscribed to `checkout.session.completed`, and put its signing secret in
      `Stripe__WebhookSecret`
- [ ] Before going live, run one full test-mode cycle: quote → checkout with
      `4242 4242 4242 4242` → booking appears → schedule confirm → complete →
      cancel another booking → refund shows in the Stripe test dashboard
- [ ] Connect onboarding: check the live Connect settings (branding, payout
      schedule) — pros onboard through the app's "Set up payouts" button

## 3. Email deliverability (or every notification lands in spam)

At your DNS provider for `worku.site`, using your SMTP provider's values:

- [ ] **SPF** — TXT on `@`: `v=spf1 include:<your-smtp-provider> ~all`
- [ ] **DKIM** — the CNAME/TXT records your SMTP provider gives you
- [ ] **DMARC** — TXT on `_dmarc`: `v=DMARC1; p=quarantine; rua=mailto:support@worku.site`
- [ ] Send yourself a password-reset email and check it arrives in the inbox
      (and look at "show original" → SPF/DKIM/DMARC all `PASS`)

## 4. Backups

- [ ] After the rebuild, confirm the sidecar wrote a dump: `ls /opt/worka/backups/`
- [ ] Set up an off-server copy (cron + rsync/scp/rclone to another box or bucket) —
      a backup on the same disk as the database is not disaster recovery
- [ ] Do one restore drill: `gunzip -c backups/worku-<date>.sql.gz | docker compose exec -T postgres psql -U $POSTGRES_USER -d worku_test_restore`

## 5. Monitoring

- [ ] Uptime: point a free monitor (e.g. UptimeRobot) at `https://worku.site/health` —
      it returns `{status:"ok"}` and checks the database connection
- [ ] Logs when something's odd: `docker compose logs api --tail 200`

## 6. Final sanity

- [ ] Read privacy.html + terms.html once as a human — fee wording matches the
      10%/£2-minimum fee, refund wording matches the cancel flow
- [ ] Google Search Console: submitted (done) — watch Pages → Indexing
- [ ] Click through both sides on your phone and laptop on the live site

## Known deliberate gaps (fine for launch, on the roadmap)

- Admin/support portal (separate app) — until then, support runs on the seed
  of `docker compose exec postgres psql` + Stripe dashboard refunds
- Server-backed notification prefs, worker availability persistence,
  email verification — settings are local-only today
- Discovery: re-book, job-progress timeline, categories/geo-search
