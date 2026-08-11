-- Add a short user-facing reference so nurses can match WhatsApp conversations to assessments.
ALTER TABLE "assessments" ADD COLUMN "reference_code" TEXT;

UPDATE "assessments"
SET "reference_code" = 'CST-' || upper(substr(replace("id", '-', ''), 1, 8));

ALTER TABLE "assessments" ALTER COLUMN "reference_code" SET NOT NULL;

CREATE UNIQUE INDEX "assessments_reference_code_key" ON "assessments"("reference_code");