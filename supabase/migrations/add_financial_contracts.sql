-- ─────────────────────────────────────────────────────────────────────────────
-- Økonomi / Kontrakter (admin-only)
-- Kjør manuelt i Supabase SQL Editor. Idempotent der det er mulig.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enums ──────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FinancialContractType" AS ENUM (
    'RENT', 'LEASE', 'HUSLEIE', 'SERVICE_AGREEMENT',
    'SUBSCRIPTION', 'INSURANCE', 'SUPPLIER', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialContractStatus" AS ENUM (
    'ACTIVE', 'EXPIRES_SOON', 'EXPIRED', 'TERMINATED', 'DRAFT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FinancialContract ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FinancialContract" (
  "id"                 TEXT PRIMARY KEY,
  "name"               TEXT NOT NULL,
  "contractNumber"     TEXT,
  "type"               "FinancialContractType" NOT NULL,
  "supplierName"       TEXT NOT NULL,
  "locationId"         TEXT,
  "centerName"         TEXT,
  "areaSqm"            DOUBLE PRECISION,
  "startDate"          TIMESTAMP(3),
  "endDate"            TIMESTAMP(3),
  "durationMonths"     INTEGER,
  "monthlyAmount"      DOUBLE PRECISION,
  "annualAmount"       DOUBLE PRECISION,
  "totalValue"         DOUBLE PRECISION,
  "currency"           TEXT NOT NULL DEFAULT 'NOK',
  "status"             "FinancialContractStatus" NOT NULL DEFAULT 'DRAFT',
  "renewalOption"      BOOLEAN NOT NULL DEFAULT false,
  "noticePeriodMonths" INTEGER,
  "description"        TEXT,
  "notes"              TEXT,
  "terminatedAt"       TIMESTAMP(3),
  "createdByProfileId" TEXT NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FinancialContractAttachment ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FinancialContractAttachment" (
  "id"                  TEXT PRIMARY KEY,
  "financialContractId" TEXT NOT NULL,
  "documentId"          TEXT,
  "fileName"            TEXT NOT NULL,
  "filePath"            TEXT NOT NULL,
  "mimeType"            TEXT NOT NULL,
  "sizeBytes"           INTEGER NOT NULL,
  "uploadedByProfileId" TEXT NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "FinancialContract"
    ADD CONSTRAINT "FinancialContract_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialContract"
    ADD CONSTRAINT "FinancialContract_createdByProfileId_fkey"
    FOREIGN KEY ("createdByProfileId") REFERENCES "Profile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialContractAttachment"
    ADD CONSTRAINT "FinancialContractAttachment_financialContractId_fkey"
    FOREIGN KEY ("financialContractId") REFERENCES "FinancialContract"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialContractAttachment"
    ADD CONSTRAINT "FinancialContractAttachment_uploadedByProfileId_fkey"
    FOREIGN KEY ("uploadedByProfileId") REFERENCES "Profile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "FinancialContract_type_idx"
  ON "FinancialContract"("type");
CREATE INDEX IF NOT EXISTS "FinancialContract_status_idx"
  ON "FinancialContract"("status");
CREATE INDEX IF NOT EXISTS "FinancialContract_locationId_idx"
  ON "FinancialContract"("locationId");
CREATE INDEX IF NOT EXISTS "FinancialContract_createdByProfileId_idx"
  ON "FinancialContract"("createdByProfileId");
CREATE INDEX IF NOT EXISTS "FinancialContract_endDate_idx"
  ON "FinancialContract"("endDate");

CREATE INDEX IF NOT EXISTS "FinancialContractAttachment_financialContractId_idx"
  ON "FinancialContractAttachment"("financialContractId");
CREATE INDEX IF NOT EXISTS "FinancialContractAttachment_uploadedByProfileId_idx"
  ON "FinancialContractAttachment"("uploadedByProfileId");

-- Storage bucket (privat) ────────────────────────────────────────────────────
-- Vedlegg lagres i en privat bucket. Signerte URL-er genereres server-side.
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-contracts', 'financial-contracts', false)
ON CONFLICT (id) DO NOTHING;
