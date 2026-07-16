-- Representative schema mirroring the EF Core model (tables snake_case, columns
-- PascalCase-quoted, matching types / NOT NULL / unique / FK-cascade) purely to
-- validate seed.sql + cleanup.sql locally. NOT used in production.
CREATE TABLE users (
  "UserId" uuid PRIMARY KEY,
  "FirstName" text NOT NULL, "LastName" text NOT NULL,
  "Email" text NOT NULL UNIQUE,
  "PasswordHash" bytea NOT NULL, "PasswordSalt" bytea NOT NULL,
  "AccountType" integer NOT NULL, "CreatedDate" timestamptz NOT NULL
);
CREATE TABLE customers (
  "CustomerId" uuid PRIMARY KEY,
  "UserId" uuid NOT NULL UNIQUE REFERENCES users("UserId") ON DELETE CASCADE,
  "FirstName" text NOT NULL, "LastName" text NOT NULL, "Email" text NOT NULL,
  "Phone" text NOT NULL, "Address" text NOT NULL, "Languages" text NOT NULL,
  "PhotoUrl" text NOT NULL, "PreferredCurrency" text NOT NULL,
  "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL
);
CREATE TABLE professionals (
  "ProfessionalId" uuid PRIMARY KEY,
  "UserId" uuid NOT NULL UNIQUE REFERENCES users("UserId") ON DELETE CASCADE,
  "FirstName" text NOT NULL, "LastName" text NOT NULL, "Email" text NOT NULL,
  "Specialty" text NOT NULL, "Bio" text NOT NULL, "ServiceArea" text NOT NULL,
  "LocationLabel" text NOT NULL, "Latitude" double precision, "Longitude" double precision,
  "Languages" text NOT NULL, "PhotoUrl" text NOT NULL, "StripeAccountId" text NOT NULL,
  "StripeChargesEnabled" boolean NOT NULL, "StripePayoutsEnabled" boolean NOT NULL,
  "StripeDetailsSubmitted" boolean NOT NULL,
  "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL
);
CREATE TABLE jobs (
  "JobId" uuid PRIMARY KEY,
  "CustomerId" uuid NOT NULL REFERENCES customers("CustomerId") ON DELETE CASCADE,
  "AcceptedQuoteId" uuid,
  "Name" text NOT NULL, "Description" text NOT NULL, "Category" text NOT NULL,
  "Address" text NOT NULL, "LocationLabel" text NOT NULL, "PhotoUrl" text NOT NULL,
  "Currency" text NOT NULL, "Latitude" double precision, "Longitude" double precision,
  "Status" integer NOT NULL, "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL
);
CREATE TABLE quotes (
  "QuoteId" uuid PRIMARY KEY,
  "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
  "JobId" uuid NOT NULL REFERENCES jobs("JobId") ON DELETE CASCADE,
  "Description" text NOT NULL, "Price" numeric(12,2) NOT NULL, "CreatedAt" timestamptz NOT NULL
);
CREATE TABLE worka_payments (
  "PaymentId" uuid PRIMARY KEY,
  "JobId" uuid NOT NULL REFERENCES jobs("JobId") ON DELETE CASCADE,
  "QuoteId" uuid NOT NULL REFERENCES quotes("QuoteId") ON DELETE CASCADE,
  "CustomerId" uuid NOT NULL REFERENCES customers("CustomerId") ON DELETE CASCADE,
  "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
  "StripeCheckoutSessionId" text NOT NULL UNIQUE, "StripePaymentIntentId" text NOT NULL,
  "StripeConnectedAccountId" text NOT NULL,
  "QuoteAmount" numeric(12,2) NOT NULL, "ServiceFeeAmount" numeric(12,2) NOT NULL,
  "TotalAmount" numeric(12,2) NOT NULL, "WorkerAmount" numeric(12,2) NOT NULL,
  "Currency" text NOT NULL, "Status" text NOT NULL,
  "CreatedAt" timestamptz NOT NULL, "UpdatedAt" timestamptz NOT NULL
);
CREATE TABLE reviews (
  "ReviewId" uuid PRIMARY KEY,
  "JobId" uuid NOT NULL UNIQUE REFERENCES jobs("JobId") ON DELETE CASCADE,
  "CustomerId" uuid NOT NULL REFERENCES customers("CustomerId") ON DELETE CASCADE,
  "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
  "Rating" integer NOT NULL, "Comment" text NOT NULL, "CreatedAt" timestamptz NOT NULL
);
CREATE TABLE job_messages (
  "JobMessageId" uuid PRIMARY KEY,
  "JobId" uuid NOT NULL REFERENCES jobs("JobId") ON DELETE CASCADE,
  "ProfessionalId" uuid NOT NULL REFERENCES professionals("ProfessionalId") ON DELETE CASCADE,
  "SenderUserId" uuid NOT NULL, "Body" text NOT NULL, "CreatedAt" timestamptz NOT NULL
);
