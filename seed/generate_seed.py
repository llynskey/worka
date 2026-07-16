"""Generate seed.sql (+ cleanup.sql) for the Fixa production demo dataset.

Writes raw INSERTs matching the EF Core schema exactly: tables are snake_case
(users, jobs, ...) but columns keep their PascalCase C# names and MUST be
double-quoted ("UserId", "PasswordHash", ...). Enums are stored as int
(AccountType: Customer=0/Professional=1; Job Status: Pending=0/Accepted=1/
Rejected=2/Completed=3/Cancelled=4). Passwords use the app's PBKDF2-SHA256,
100k iterations, 16-byte salt, 32-byte key, stored as bytea.

Every seeded account uses an @seed.fixa.site email so cleanup.sql can remove the
whole dataset. Deterministic (fixed RNG) so the generated SQL is stable.
Run once against production inside a transaction.
"""
import hashlib
import random
import uuid

import seed_data as D

rng = random.Random(20260716)
PASSWORD = "FixaDemo123!"
SEED_DOMAIN = "seed.fixa.site"

N_PROS = 18
N_CUSTOMERS = 24
N_JOBS = 120

UK_STREETS = ["High Street", "Church Lane", "Victoria Road", "Mill Lane", "Station Road",
              "Kings Road", "Queen Street", "Park Avenue", "Green Lane", "Albert Road",
              "Oak Close", "Elm Drive", "Meadow Way", "Springfield Road", "Manor Court"]
FR_STREETS = ["Rue de la Paix", "Avenue Victor Hugo", "Rue du Commerce", "Boulevard Saint-Michel",
              "Rue Nationale", "Rue des Fleurs", "Avenue de la Republique", "Rue Gambetta",
              "Rue Pasteur", "Allee des Tilleuls", "Impasse des Lilas", "Rue de la Gare"]


# ---- helpers -------------------------------------------------------------
def new_id():
    return str(uuid.UUID(int=rng.getrandbits(128)))


def esc(s):
    return str(s).replace("'", "''")


def S(s):
    return "'" + esc(s) + "'"


def hashed_password():
    salt = bytes(rng.getrandbits(8) for _ in range(16))
    h = hashlib.pbkdf2_hmac("sha256", PASSWORD.encode(), salt, 100_000, dklen=32)
    return f"decode('{salt.hex()}','hex')", f"decode('{h.hex()}','hex')"


def ts(days_ago):
    return f"now() - interval '{days_ago} days'"


def jitter(v):
    return round(v + rng.uniform(-0.055, 0.055), 5)


def money(currency):
    return float(rng.randrange(60, 820, 5)) if currency == "gbp" else float(rng.randrange(70, 900, 5))


def person(country):
    if country == "FR":
        return rng.choice(D.FR_FIRST), rng.choice(D.FR_LAST)
    return rng.choice(D.UK_FIRST), rng.choice(D.UK_LAST)


def langs_for(country):
    return rng.choice(["fr", "fr,en", "fr,en", "fr,ar"]) if country == "FR" \
        else rng.choice(["en", "en,es", "en,pl", "en,ro", "en,ar"])


def street_for(country):
    return rng.choice(FR_STREETS if country == "FR" else UK_STREETS)


users, customers, professionals, jobs, quotes, payments, reviews, messages = ([] for _ in range(8))

# ---- professionals -------------------------------------------------------
pros = []
for i in range(N_PROS):
    city, country, clat, clng = rng.choice(D.CITIES)
    first, last = person(country)
    uid, pid = new_id(), new_id()
    email = f"pro.{first}.{last}{i}@{SEED_DOMAIN}".lower()
    cat = rng.choice(D.CATEGORIES)
    specialty = D.CATEGORY_JOBS[cat][0]
    salt, ph = hashed_password()
    created = rng.randint(40, 300)
    users.append(f"({S(uid)},{S(first)},{S(last)},{S(email)},{ph},{salt},1,{ts(created)})")
    professionals.append(
        f"({S(pid)},{S(uid)},{S(first)},{S(last)},{S(email)},{S(specialty)},"
        f"{S(rng.choice(D.PRO_BIOS))},{S(city + ' and surrounding areas')},{S(city)},"
        f"{jitter(clat)},{jitter(clng)},{S(langs_for(country))},'','acct_seed_{i}',"
        f"true,true,true,{ts(created)},{ts(created)})")
    pros.append({"uid": uid, "pid": pid, "acct": f"acct_seed_{i}", "country": country})

# ---- customers -----------------------------------------------------------
custs = []
for i in range(N_CUSTOMERS):
    city, country, clat, clng = rng.choice(D.CITIES)
    first, last = person(country)
    uid, cid = new_id(), new_id()
    email = f"cust.{first}.{last}{i}@{SEED_DOMAIN}".lower()
    currency = "eur" if country == "FR" else "gbp"
    salt, ph = hashed_password()
    created = rng.randint(30, 260)
    phone = f"0{rng.randint(7000000000, 7999999999)}" if country == "GB" else f"0{rng.randint(600000000, 799999999)}"
    addr = f"{rng.randint(1, 220)} {street_for(country)}, {city}"
    users.append(f"({S(uid)},{S(first)},{S(last)},{S(email)},{ph},{salt},0,{ts(created)})")
    customers.append(
        f"({S(cid)},{S(uid)},{S(first)},{S(last)},{S(email)},{S(phone)},{S(addr)},"
        f"{S(langs_for(country))},'',{S(currency)},{ts(created)},{ts(created)})")
    custs.append({"uid": uid, "cid": cid, "city": city, "country": country,
                  "lat": clat, "lng": clng, "currency": currency})

# ---- jobs (+ quotes, payments, reviews, messages) ------------------------
STATUS_POOL = ([0] * 60) + ([1] * 15) + ([3] * 20) + ([4] * 5)  # pending/accepted/completed/cancelled


def fee(amount):
    f = max(2.0, round(amount * 0.10, 2))
    return f, round(amount + f, 2)


for j in range(N_JOBS):
    cust = rng.choice(custs)
    country = cust["country"]
    currency = cust["currency"]
    city = cust["city"]
    cat = rng.choice(D.CATEGORIES)
    title, desc = rng.choice(D.CATEGORY_JOBS[cat][1])
    status = rng.choice(STATUS_POOL)
    jid = new_id()
    created = rng.randint(1, 55) if status in (0, 1) else rng.randint(20, 120)
    addr = f"{rng.randint(1, 220)} {street_for(country)}, {city}"
    label = f"{city} area"
    lat, lng = jitter(cust["lat"]), jitter(cust["lng"])

    # quotes
    if status in (1, 3):
        n_q = rng.randint(1, 3)
    elif status == 0:
        n_q = rng.randint(0, 4)
    else:
        n_q = rng.randint(0, 2)
    quoting = rng.sample(pros, min(n_q, len(pros)))
    job_quotes = []
    for p in quoting:
        qid = new_id()
        price = money(currency)
        q_created = rng.randint(0, max(1, created - 1))
        quotes.append(f"({S(qid)},{S(p['pid'])},{S(jid)},{S(rng.choice(['Happy to take this on, price includes labour and materials.','This covers a full visit and all parts needed.','Firm quote based on the description; can confirm on site.']))},{price:.2f},{ts(q_created)})")
        job_quotes.append({"qid": qid, "pid": p["pid"], "uid": p["uid"], "acct": p["acct"], "price": price})

    accepted = None
    if status in (1, 3) and job_quotes:
        accepted = rng.choice(job_quotes)

    accepted_sql = S(accepted["qid"]) if accepted else "NULL"
    jobs.append(
        f"({S(jid)},{S(cust['cid'])},{accepted_sql},{S(title)},{S(desc)},{S(cat)},"
        f"{S(addr)},{S(label)},'',{S(currency)},{lat},{lng},{status},{ts(created)},{ts(created)})")

    # payment for booked/completed
    if accepted:
        pid_pay = new_id()
        amt = accepted["price"]
        svc, total = fee(amt)
        pay_created = rng.randint(0, max(1, created - 1))
        payments.append(
            f"({S(pid_pay)},{S(jid)},{S(accepted['qid'])},{S(cust['cid'])},{S(accepted['pid'])},"
            f"'cs_seed_{pid_pay[:12]}','pi_seed_{pid_pay[:12]}',{S(accepted['acct'])},"
            f"{amt:.2f},{svc:.2f},{total:.2f},{amt:.2f},{S(currency)},'paid',{ts(pay_created)},{ts(pay_created)})")

    # review for completed
    if status == 3 and accepted and rng.random() < 0.8:
        rid = new_id()
        comment, rating = rng.choice(D.REVIEW_TEXTS)
        reviews.append(
            f"({S(rid)},{S(jid)},{S(cust['cid'])},{S(accepted['pid'])},{rating},{S(comment)},{ts(max(0, created - 2))})")

    # messages thread with one quoting pro
    thread_pro = accepted or (rng.choice(job_quotes) if job_quotes else None)
    if thread_pro and rng.random() < 0.65:
        n_m = rng.randint(2, 6)
        for m in range(n_m):
            from_customer = (m % 2 == 0)
            body = rng.choice(D.CUSTOMER_MESSAGES if from_customer else D.PRO_MESSAGES)
            sender = cust["uid"] if from_customer else thread_pro["uid"]
            m_created = max(0, created - n_m + m)
            messages.append(
                f"({S(new_id())},{S(jid)},{S(thread_pro['pid'])},{S(sender)},{S(body)},{ts(m_created)})")


# ---- emit ----------------------------------------------------------------
def block(table, cols, rows):
    if not rows:
        return ""
    header = f'INSERT INTO {table} ({", ".join(chr(34) + c + chr(34) for c in cols)}) VALUES\n'
    return header + ",\n".join(rows) + ";\n\n"


parts = ["-- Fixa demo seed. Generated by seed/generate_seed.py. Run ONCE.\n",
         f"-- Demo login password for every seeded account: {PASSWORD}\n",
         "-- Remove everything later with seed/cleanup.sql\n\nBEGIN;\n\n"]
parts.append(block("users", ["UserId", "FirstName", "LastName", "Email", "PasswordHash", "PasswordSalt", "AccountType", "CreatedDate"], users))
parts.append(block("customers", ["CustomerId", "UserId", "FirstName", "LastName", "Email", "Phone", "Address", "Languages", "PhotoUrl", "PreferredCurrency", "CreatedAt", "UpdatedAt"], customers))
parts.append(block("professionals", ["ProfessionalId", "UserId", "FirstName", "LastName", "Email", "Specialty", "Bio", "ServiceArea", "LocationLabel", "Latitude", "Longitude", "Languages", "PhotoUrl", "StripeAccountId", "StripeChargesEnabled", "StripePayoutsEnabled", "StripeDetailsSubmitted", "CreatedAt", "UpdatedAt"], professionals))
parts.append(block("jobs", ["JobId", "CustomerId", "AcceptedQuoteId", "Name", "Description", "Category", "Address", "LocationLabel", "PhotoUrl", "Currency", "Latitude", "Longitude", "Status", "CreatedAt", "UpdatedAt"], jobs))
parts.append(block("quotes", ["QuoteId", "ProfessionalId", "JobId", "Description", "Price", "CreatedAt"], quotes))
parts.append(block("worka_payments", ["PaymentId", "JobId", "QuoteId", "CustomerId", "ProfessionalId", "StripeCheckoutSessionId", "StripePaymentIntentId", "StripeConnectedAccountId", "QuoteAmount", "ServiceFeeAmount", "TotalAmount", "WorkerAmount", "Currency", "Status", "CreatedAt", "UpdatedAt"], payments))
parts.append(block("reviews", ["ReviewId", "JobId", "CustomerId", "ProfessionalId", "Rating", "Comment", "CreatedAt"], reviews))
parts.append(block("job_messages", ["JobMessageId", "JobId", "ProfessionalId", "SenderUserId", "Body", "CreatedAt"], messages))
parts.append("COMMIT;\n")

with open("seed.sql", "w", encoding="utf-8") as f:
    f.write("".join(parts))

cleanup = f"""-- Remove the entire Fixa demo dataset (everything under @{SEED_DOMAIN}).
BEGIN;
DELETE FROM job_messages   WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@{SEED_DOMAIN}');
DELETE FROM reviews        WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@{SEED_DOMAIN}');
DELETE FROM worka_payments WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@{SEED_DOMAIN}');
DELETE FROM quotes         WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@{SEED_DOMAIN}');
DELETE FROM jobs           WHERE "CustomerId"     IN (SELECT "CustomerId"     FROM customers     WHERE "Email" LIKE '%@{SEED_DOMAIN}');
DELETE FROM professionals  WHERE "Email" LIKE '%@{SEED_DOMAIN}';
DELETE FROM customers      WHERE "Email" LIKE '%@{SEED_DOMAIN}';
DELETE FROM users          WHERE "Email" LIKE '%@{SEED_DOMAIN}';
COMMIT;
"""
with open("cleanup.sql", "w", encoding="utf-8") as f:
    f.write(cleanup)

print(f"users={len(users)} customers={len(customers)} pros={len(professionals)} jobs={len(jobs)} "
      f"quotes={len(quotes)} payments={len(payments)} reviews={len(reviews)} messages={len(messages)}")
