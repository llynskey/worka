-- Remove the entire Fixa demo dataset (everything under @seed.fixa.site).
BEGIN;
DELETE FROM job_messages   WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.fixa.site');
DELETE FROM reviews        WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.fixa.site');
DELETE FROM worka_payments WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.fixa.site');
DELETE FROM quotes         WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.fixa.site');
DELETE FROM jobs           WHERE "CustomerId"     IN (SELECT "CustomerId"     FROM customers     WHERE "Email" LIKE '%@seed.fixa.site');
DELETE FROM professionals  WHERE "Email" LIKE '%@seed.fixa.site';
DELETE FROM customers      WHERE "Email" LIKE '%@seed.fixa.site';
DELETE FROM users          WHERE "Email" LIKE '%@seed.fixa.site';
COMMIT;
