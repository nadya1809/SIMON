ALTER TYPE "RewardPunishmentType" ADD VALUE IF NOT EXISTS 'EVALUASI';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'RewardPunishmentPeriodKind'
    ) THEN
        CREATE TYPE "RewardPunishmentPeriodKind" AS ENUM (
            'DAILY',
            'WORKWEEK',
            'MONTHLY',
            'QUARTERLY',
            'SEMIANNUAL',
            'YEARLY'
        );
    END IF;
END $$;

ALTER TABLE "RewardPunishment"
ADD COLUMN IF NOT EXISTS "periodKind" "RewardPunishmentPeriodKind",
ADD COLUMN IF NOT EXISTS "referenceDate" DATE;

UPDATE "RewardPunishment"
SET
    "periodKind" = COALESCE("periodKind", 'MONTHLY'::"RewardPunishmentPeriodKind"),
    "referenceDate" = COALESCE("referenceDate", "periodEnd");

ALTER TABLE "RewardPunishment"
ALTER COLUMN "periodKind" SET DEFAULT 'MONTHLY',
ALTER COLUMN "periodKind" SET NOT NULL,
ALTER COLUMN "referenceDate" SET DEFAULT CURRENT_DATE,
ALTER COLUMN "referenceDate" SET NOT NULL;
