-- CreateEnum
CREATE TYPE "Role" AS ENUM ('learner', 'admin');

-- CreateEnum
CREATE TYPE "LearningGoal" AS ENUM ('move_canada', 'move_quebec', 'move_france', 'work', 'study', 'immigration', 'travel', 'exam', 'culture', 'relationship', 'personal', 'other');

-- CreateEnum
CREATE TYPE "Destination" AS ENUM ('canada_quebec', 'france', 'both', 'undecided');

-- CreateEnum
CREATE TYPE "PriorExperience" AS ENUM ('never', 'few_words', 'a_little', 'simple_conversations', 'intermediate', 'advanced', 'unknown');

-- CreateEnum
CREATE TYPE "CorrectionMode" AS ENUM ('immediate', 'important_only', 'no_interruptions', 'report_only');

-- CreateEnum
CREATE TYPE "SupportPreference" AS ENUM ('more_portuguese', 'auto', 'more_french');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('not_started', 'skipped', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar', 'pronunciation');

-- CreateEnum
CREATE TYPE "Dimension" AS ENUM ('recognition', 'recall', 'listening', 'writing', 'speaking', 'pronunciation');

-- CreateEnum
CREATE TYPE "EstimateSource" AS ENUM ('placement', 'self_report', 'practice');

-- CreateEnum
CREATE TYPE "PlacementMode" AS ENUM ('quick', 'complete');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "TraceSource" AS ENUM ('lesson', 'review', 'placement_gap', 'tutor', 'practice', 'manual');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('in_progress', 'completed');

-- CreateEnum
CREATE TYPE "PracticeContext" AS ENUM ('lesson', 'review', 'session', 'lab');

-- CreateEnum
CREATE TYPE "DailySessionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "PersonalItemKind" AS ENUM ('correction', 'saved_expression');

-- CreateEnum
CREATE TYPE "ConversationMode" AS ENUM ('text', 'voice');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'ended');

-- CreateEnum
CREATE TYPE "TurnRole" AS ENUM ('learner', 'tutor');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'learner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_profiles" (
    "userId" TEXT NOT NULL,
    "goals" "LearningGoal"[],
    "goalOther" TEXT,
    "destination" "Destination" NOT NULL,
    "priorExperience" "PriorExperience" NOT NULL,
    "dailyMinutes" INTEGER NOT NULL,
    "targetLevel" TEXT,
    "targetDate" DATE,
    "correctionMode" "CorrectionMode" NOT NULL DEFAULT 'important_only',
    "supportPreference" "SupportPreference" NOT NULL DEFAULT 'auto',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "weeklyGoalDays" INTEGER NOT NULL DEFAULT 5,
    "startLessonId" TEXT,
    "placementStatus" "PlacementStatus" NOT NULL DEFAULT 'not_started',
    "keepRecordings" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "skill_estimates" (
    "userId" TEXT NOT NULL,
    "skill" "Skill" NOT NULL,
    "theta" DOUBLE PRECISION NOT NULL,
    "sd" DOUBLE PRECISION NOT NULL,
    "source" "EstimateSource" NOT NULL,
    "assessed" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_estimates_pkey" PRIMARY KEY ("userId","skill")
);

-- CreateTable
CREATE TABLE "placement_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PlacementMode" NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
    "skills" "Skill"[],
    "currentItemId" TEXT,
    "report" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "placement_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_responses" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "skill" "Skill" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "scored" BOOLEAN NOT NULL DEFAULT true,
    "answer" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_traces" (
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "elapsedDays" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    "learningSteps" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "lapses" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "lastReview" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "lastScore" DOUBLE PRECISION,
    "source" "TraceSource" NOT NULL,
    "introducedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_traces_pkey" PRIMARY KEY ("userId","conceptId","dimension")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "rating" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "elapsedDays" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    "learningSteps" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "activityId" TEXT,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'in_progress',
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "runs" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("userId","lessonId")
);

-- CreateTable
CREATE TABLE "activity_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "lessonId" TEXT,
    "sessionId" TEXT,
    "context" "PracticeContext" NOT NULL,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "durationMs" INTEGER,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "status" "DailySessionStatus" NOT NULL DEFAULT 'planned',
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "daily_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "studySeconds" INTEGER NOT NULL DEFAULT 0,
    "activitiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "reviewsDone" INTEGER NOT NULL DEFAULT 0,
    "newConcepts" INTEGER NOT NULL DEFAULT 0,
    "listeningSeconds" INTEGER NOT NULL DEFAULT 0,
    "speakingSeconds" INTEGER NOT NULL DEFAULT 0,
    "sessionCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("userId","localDate")
);

-- CreateTable
CREATE TABLE "personal_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PersonalItemKind" NOT NULL,
    "french" TEXT NOT NULL,
    "wrong" TEXT,
    "portuguese" TEXT,
    "explanation" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "mode" "ConversationMode" NOT NULL DEFAULT 'text',
    "correctionMode" "CorrectionMode" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "level" TEXT NOT NULL,
    "report" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_turns" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "TurnRole" NOT NULL,
    "content" TEXT NOT NULL,
    "corrections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetText" TEXT NOT NULL,
    "activityId" TEXT,
    "provider" TEXT NOT NULL,
    "transcript" TEXT,
    "scores" JSONB NOT NULL,
    "recordingKey" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speech_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("userId","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "placement_attempts_userId_startedAt_idx" ON "placement_attempts"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "placement_responses_itemId_idx" ON "placement_responses"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "placement_responses_attemptId_itemId_key" ON "placement_responses"("attemptId", "itemId");

-- CreateIndex
CREATE INDEX "memory_traces_userId_due_idx" ON "memory_traces"("userId", "due");

-- CreateIndex
CREATE INDEX "review_logs_userId_reviewedAt_idx" ON "review_logs"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "activity_attempts_userId_createdAt_idx" ON "activity_attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_attempts_activityId_idx" ON "activity_attempts"("activityId");

-- CreateIndex
CREATE INDEX "daily_sessions_userId_localDate_idx" ON "daily_sessions"("userId", "localDate");

-- CreateIndex
CREATE INDEX "personal_items_userId_createdAt_idx" ON "personal_items"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "conversations_userId_createdAt_idx" ON "conversations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_turns_conversationId_createdAt_idx" ON "conversation_turns"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "speech_attempts_userId_createdAt_idx" ON "speech_attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "study_events_userId_createdAt_idx" ON "study_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "study_events_type_createdAt_idx" ON "study_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_estimates" ADD CONSTRAINT "skill_estimates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_attempts" ADD CONSTRAINT "placement_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_responses" ADD CONSTRAINT "placement_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "placement_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_traces" ADD CONSTRAINT "memory_traces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_sessions" ADD CONSTRAINT "daily_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_items" ADD CONSTRAINT "personal_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_attempts" ADD CONSTRAINT "speech_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_events" ADD CONSTRAINT "study_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
