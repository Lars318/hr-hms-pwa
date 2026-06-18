-- Add new enum types
CREATE TYPE "SickLeaveCaseStatus" AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE "FollowUpStepType" AS ENUM ('OPPFOLGING_PLAN', 'DIALOG_MOTE_1', 'DIALOG_MOTE_2', 'NAV_NOTIFICATION');
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'HOURLY', 'ANNUAL');
CREATE TYPE "AlertType" AS ENUM ('PROBATION_ENDING', 'TRAINING_EXPIRING', 'BIRTHDAY');

-- Add new columns to Profile
ALTER TABLE "Profile" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "probationEndsAt" TIMESTAMP(3);

-- SickLeaveCase
CREATE TABLE "SickLeaveCase" (
    "id"         TEXT NOT NULL,
    "startDate"  TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "totalDays"  INTEGER NOT NULL DEFAULT 0,
    "status"     "SickLeaveCaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes"      TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "SickLeaveCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SickLeaveCase_employeeId_idx" ON "SickLeaveCase"("employeeId");
CREATE INDEX "SickLeaveCase_status_idx" ON "SickLeaveCase"("status");
CREATE INDEX "SickLeaveCase_startDate_idx" ON "SickLeaveCase"("startDate");
ALTER TABLE "SickLeaveCase" ADD CONSTRAINT "SickLeaveCase_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SickLeaveFollowUpStep
CREATE TABLE "SickLeaveFollowUpStep" (
    "id"            TEXT NOT NULL,
    "type"          "FollowUpStepType" NOT NULL,
    "dueDate"       TIMESTAMP(3) NOT NULL,
    "completedAt"   TIMESTAMP(3),
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId"        TEXT NOT NULL,
    "completedById" TEXT,
    CONSTRAINT "SickLeaveFollowUpStep_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SickLeaveFollowUpStep_caseId_idx" ON "SickLeaveFollowUpStep"("caseId");
CREATE INDEX "SickLeaveFollowUpStep_dueDate_idx" ON "SickLeaveFollowUpStep"("dueDate");
ALTER TABLE "SickLeaveFollowUpStep" ADD CONSTRAINT "SickLeaveFollowUpStep_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "SickLeaveCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SickLeaveFollowUpStep" ADD CONSTRAINT "SickLeaveFollowUpStep_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EmploymentRecord
CREATE TABLE "EmploymentRecord" (
    "id"                   TEXT NOT NULL,
    "effectiveFrom"        TIMESTAMP(3) NOT NULL,
    "effectiveTo"          TIMESTAMP(3),
    "employmentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "salary"               INTEGER,
    "salaryType"           "SalaryType" NOT NULL DEFAULT 'MONTHLY',
    "jobTitle"             TEXT,
    "notes"                TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId"            TEXT NOT NULL,
    "createdById"          TEXT,
    CONSTRAINT "EmploymentRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmploymentRecord_profileId_idx" ON "EmploymentRecord"("profileId");
CREATE INDEX "EmploymentRecord_effectiveFrom_idx" ON "EmploymentRecord"("effectiveFrom");
ALTER TABLE "EmploymentRecord" ADD CONSTRAINT "EmploymentRecord_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmploymentRecord" ADD CONSTRAINT "EmploymentRecord_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SentAlert
CREATE TABLE "SentAlert" (
    "id"       TEXT NOT NULL,
    "type"     "AlertType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "year"     INTEGER NOT NULL,
    "sentAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SentAlert_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SentAlert_type_entityId_year_key" ON "SentAlert"("type", "entityId", "year");
CREATE INDEX "SentAlert_type_idx" ON "SentAlert"("type");
