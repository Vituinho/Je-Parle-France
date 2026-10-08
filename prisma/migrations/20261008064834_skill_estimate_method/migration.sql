-- CreateEnum
CREATE TYPE "EstimateMethod" AS ENUM ('objective', 'perception', 'self_assessment', 'self_report', 'not_assessed');

-- AlterTable
ALTER TABLE "skill_estimates" ADD COLUMN     "method" "EstimateMethod" NOT NULL DEFAULT 'objective';

-- Backfill: onboarding estimates are self-reports, and placement skills that
-- were never assessed keep that status. Placement self-assessments cannot be
-- told apart from older rows and stay "objective" until the next placement.
UPDATE "skill_estimates" SET "method" = 'self_report' WHERE "source" = 'self_report';
UPDATE "skill_estimates" SET "method" = 'not_assessed' WHERE "source" = 'placement' AND "assessed" = false;
