import "server-only";
import { getContent } from "@/lib/content";
import { SKILLS } from "@/lib/learning/skills";
import { experiencePrior, type OnboardingInput } from "@/lib/learning/onboarding";
import { db } from "@/server/db";
import { levelIndex, readTheta } from "@/lib/learning/cefr";
import { studyPace } from "@/lib/learning/study-pace";

/**
 * Saves the onboarding answers, seeds self-reported skill estimates (marked as
 * not assessed) and returns where the learner should go next.
 */
export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const prior = experiencePrior(input.priorExperience);
  const fromZero = input.start === "from_zero";
  const firstCoreLesson = getContent().paths.core[0]?.lesson.id ?? null;
  const profile = {
    goals: input.goals,
    goalOther: input.goals.includes("other") ? (input.goalOther ?? null) : null,
    destination: input.destination,
    priorExperience: input.priorExperience,
    dailyMinutes: input.dailyMinutes,
    studyPace: studyPace(input.studyPace, input.dailyMinutes),
    targetLevel: input.targetLevel,
    targetDate: input.targetMonth ? new Date(`${input.targetMonth}-01T00:00:00Z`) : null,
    placementStatus: fromZero ? ("skipped" as const) : ("not_started" as const),
    startLessonId: fromZero ? firstCoreLesson : null,
    onboardedAt: new Date(),
  };

  await db.$transaction([
    db.learnerProfile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: profile,
    }),
    ...SKILLS.map((skill) =>
      db.skillEstimate.upsert({
        where: { userId_skill: { userId, skill } },
        create: {
          userId,
          skill,
          theta: prior.mean,
          sd: prior.sd,
          source: "self_report",
          assessed: false,
          method: "self_report",
          calibrationTheta: prior.mean,
          calibrationSd: prior.sd,
          calibratedAt: profile.onboardedAt,
          calibrationMethod: "self_report",
          displayBand: levelIndex(readTheta(prior.mean).level),
        },
        // Never overwrite a real assessment with a self-report.
        update: {},
      }),
    ),
    db.studyEvent.create({
      data: {
        userId,
        type: "onboarding_completed",
        payload: {
          start: input.start,
          dailyMinutes: input.dailyMinutes,
          destination: input.destination,
          priorExperience: input.priorExperience,
        },
      },
    }),
  ]);

  return { next: fromZero ? "/hoje" : `/diagnostico?modo=${input.start}` };
}
