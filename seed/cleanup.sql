-- Remove the entire Worku demo dataset (everything under @seed.worku.site).
BEGIN;
DELETE FROM job_messages   WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.worku.site');
DELETE FROM reviews        WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.worku.site');
DELETE FROM worka_payments WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.worku.site');
DELETE FROM quotes         WHERE "ProfessionalId" IN (SELECT "ProfessionalId" FROM professionals WHERE "Email" LIKE '%@seed.worku.site');
DELETE FROM jobs           WHERE "CustomerId"     IN (SELECT "CustomerId"     FROM customers     WHERE "Email" LIKE '%@seed.worku.site');
DELETE FROM professionals  WHERE "Email" LIKE '%@seed.worku.site';
DELETE FROM customers      WHERE "Email" LIKE '%@seed.worku.site';
DELETE FROM users          WHERE "Email" LIKE '%@seed.worku.site';
COMMIT;
