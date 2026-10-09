CREATE TYPE "StudyPace" AS ENUM ('light', 'balanced', 'accelerated', 'immersion');
ALTER TABLE "learner_profiles" ADD COLUMN "studyPace" "StudyPace";
