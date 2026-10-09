ALTER TABLE "review_logs" ADD COLUMN "score" DOUBLE PRECISION, ADD COLUMN "hinted" BOOLEAN, ADD COLUMN "selfRated" BOOLEAN;
ALTER TABLE "activity_attempts" ADD COLUMN "level" TEXT, ADD COLUMN "hinted" BOOLEAN, ADD COLUMN "selfRated" BOOLEAN;
ALTER TABLE "daily_activity" ADD COLUMN "activeSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "study_events" ADD COLUMN "sessionId" TEXT, ADD COLUMN "dedupeKey" TEXT;
CREATE INDEX "activity_attempts_sessionId_createdAt_idx" ON "activity_attempts"("sessionId", "createdAt");
CREATE INDEX "study_events_sessionId_createdAt_idx" ON "study_events"("sessionId", "createdAt");
CREATE UNIQUE INDEX "study_events_userId_dedupeKey_key" ON "study_events"("userId", "dedupeKey");
ALTER TABLE "study_events" ADD CONSTRAINT "study_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "daily_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
