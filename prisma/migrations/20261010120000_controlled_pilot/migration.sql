CREATE TYPE "PilotStatus" AS ENUM ('invited', 'active', 'withdrawn', 'finished');
CREATE TYPE "PerceivedDifficulty" AS ENUM ('easy', 'balanced', 'hard');
ALTER TABLE "speech_attempts" ADD COLUMN "locale" TEXT;

CREATE TABLE "pilot_participants" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "status" "PilotStatus" NOT NULL DEFAULT 'invited',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consentVersion" TEXT,
  "consentedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "pilot_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "pilot_participants_status_invitedAt_idx" ON "pilot_participants"("status", "invitedAt");

CREATE TABLE "pilot_feedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "difficulty" "PerceivedDifficulty" NOT NULL,
  "text" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pilot_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "pilot_feedback_userId_context_sourceId_key" ON "pilot_feedback"("userId", "context", "sourceId");
CREATE INDEX "pilot_feedback_userId_createdAt_idx" ON "pilot_feedback"("userId", "createdAt");

CREATE TABLE "pilot_calibration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "sourceKind" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "record" JSONB NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pilot_calibration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pilot_calibration_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "pilot_calibration_userId_sourceKind_sourceId_key" ON "pilot_calibration"("userId", "sourceKind", "sourceId");
CREATE INDEX "pilot_calibration_userId_createdAt_idx" ON "pilot_calibration"("userId", "createdAt");
