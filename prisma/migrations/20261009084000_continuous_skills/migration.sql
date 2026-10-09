ALTER TABLE "skill_estimates"
  ADD COLUMN "calibrationTheta" DOUBLE PRECISION,
  ADD COLUMN "calibrationSd" DOUBLE PRECISION,
  ADD COLUMN "calibratedAt" TIMESTAMP(3),
  ADD COLUMN "calibrationMethod" "EstimateMethod",
  ADD COLUMN "displayBand" INTEGER,
  ADD COLUMN "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "evidenceDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distinctTasks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "effectiveWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'calibration',
  ADD COLUMN "lastEvidenceAt" TIMESTAMP(3);

UPDATE "skill_estimates" SET
  "calibrationTheta" = "theta", "calibrationSd" = "sd",
  "calibratedAt" = "updatedAt", "calibrationMethod" = "method",
  "displayBand" = LEAST(5, GREATEST(0, FLOOR("theta")::INTEGER));

CREATE TABLE "skill_evidence" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "skill" "Skill" NOT NULL,
  "key" TEXT NOT NULL, "taskId" TEXT NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "quality" DOUBLE PRECISION NOT NULL,
  "guess" DOUBLE PRECISION NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL,
  "concepts" TEXT[] NOT NULL, "source" TEXT NOT NULL, "assessment" TEXT NOT NULL,
  "substantial" BOOLEAN NOT NULL,
  CONSTRAINT "skill_evidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "skill_evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "skill_evidence_values_check" CHECK ("score" BETWEEN 0 AND 1 AND "confidence" BETWEEN 0 AND 1 AND "quality" BETWEEN 0 AND 1 AND "guess" BETWEEN 0 AND .75 AND "difficulty" BETWEEN 0 AND 6)
);
CREATE UNIQUE INDEX "skill_evidence_userId_skill_key_key" ON "skill_evidence"("userId", "skill", "key");
CREATE INDEX "skill_evidence_userId_skill_occurredAt_idx" ON "skill_evidence"("userId", "skill", "occurredAt");
