import { z } from "zod";
import { CEFR_LEVELS, levelIndex, type CefrLevel } from "./cefr";

export const LEARNING_GOALS = [
  "move_canada",
  "move_quebec",
  "move_france",
  "work",
  "study",
  "immigration",
  "travel",
  "exam",
  "culture",
  "relationship",
  "personal",
  "other",
] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number];

export const DESTINATIONS = ["canada_quebec", "france", "both", "undecided"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const PRIOR_EXPERIENCES = [
  "never",
  "few_words",
  "a_little",
  "simple_conversations",
  "intermediate",
  "advanced",
  "unknown",
] as const;
export type PriorExperience = (typeof PRIOR_EXPERIENCES)[number];

export const DAILY_MINUTES = [5, 15, 30, 60] as const;
export type DailyMinutes = (typeof DAILY_MINUTES)[number];

export const START_CHOICES = ["quick", "complete", "from_zero"] as const;
export type StartChoice = (typeof START_CHOICES)[number];

const targetDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Use o formato AAAA-MM")
  .optional();

export const onboardingSchema = z
  .object({
    goals: z.array(z.enum(LEARNING_GOALS)).min(1, "Escolha pelo menos um objetivo").max(12),
    goalOther: z.string().trim().max(120).optional(),
    destination: z.enum(DESTINATIONS),
    priorExperience: z.enum(PRIOR_EXPERIENCES),
    dailyMinutes: z.literal(DAILY_MINUTES),
    targetLevel: z.enum(CEFR_LEVELS).exclude(["A0"]).nullable(),
    /** Month the learner hopes to reach the target level, "YYYY-MM". */
    targetMonth: targetDateSchema,
    start: z.enum(START_CHOICES),
  })
  .refine((value) => !value.goals.includes("other") || Boolean(value.goalOther), {
    path: ["goalOther"],
    message: "Conte em poucas palavras qual é o seu objetivo",
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Prior belief about ability (CEFR scale, see cefr.ts) from the self-reported
 * experience. Wide on purpose: self-reports are noisy. Also the prior used by
 * the adaptive placement test.
 */
export function experiencePrior(experience: PriorExperience): { mean: number; sd: number } {
  switch (experience) {
    case "never":
      return { mean: 0.25, sd: 0.6 };
    case "few_words":
      return { mean: 0.7, sd: 0.7 };
    case "a_little":
      return { mean: 1.4, sd: 0.9 };
    case "simple_conversations":
      return { mean: 2.3, sd: 1.0 };
    case "intermediate":
      return { mean: 3.4, sd: 1.0 };
    case "advanced":
      return { mean: 4.6, sd: 1.1 };
    case "unknown":
      return { mean: 1.8, sd: 1.5 };
  }
}

export function recommendedStart(experience: PriorExperience): StartChoice {
  return experience === "never" ? "from_zero" : "quick";
}

/**
 * Typical cumulative study hours to *reach* each level, using the ranges
 * commonly published by French-language schools (e.g. Alliance Française) for
 * guided learning. Indicative only — they vary widely between people.
 */
export const CUMULATIVE_HOURS: Record<Exclude<CefrLevel, "A0">, [number, number]> = {
  A1: [60, 100],
  A2: [160, 200],
  B1: [350, 400],
  B2: [550, 650],
  C1: [800, 1000],
};

const levelStartHours = (theta: number): number => {
  // Interpolate hours already invested from the current ability.
  const anchors: [number, number][] = [
    [0, 0],
    [1, 80],
    [2, 180],
    [3, 375],
    [4, 600],
    [5, 900],
  ];
  if (theta <= 0) return 0;
  for (let i = 1; i < anchors.length; i += 1) {
    const [x1, y1] = anchors[i] as [number, number];
    const [x0, y0] = anchors[i - 1] as [number, number];
    if (theta <= x1) return y0 + ((theta - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 900;
};

export interface TimeEstimate {
  /** Remaining study hours (low, high). */
  hours: [number, number];
  /** Calendar months at the given pace (low, high). */
  months: [number, number];
  alreadyThere: boolean;
}

export function estimateTimeToLevel(params: {
  currentTheta: number;
  targetLevel: Exclude<CefrLevel, "A0">;
  dailyMinutes: number;
  daysPerWeek: number;
}): TimeEstimate {
  const { currentTheta, targetLevel, dailyMinutes, daysPerWeek } = params;
  // Reaching a level means reaching the start of its band.
  if (currentTheta >= levelIndex(targetLevel)) {
    return { hours: [0, 0], months: [0, 0], alreadyThere: true };
  }
  const invested = levelStartHours(currentTheta);
  const [low, high] = CUMULATIVE_HOURS[targetLevel];
  const hours: [number, number] = [Math.max(0, low - invested), Math.max(0, high - invested)];
  const hoursPerMonth = (dailyMinutes / 60) * daysPerWeek * (52 / 12);
  const months: [number, number] = [
    Math.ceil(hours[0] / hoursPerMonth),
    Math.ceil(hours[1] / hoursPerMonth),
  ];
  return { hours: [Math.round(hours[0]), Math.round(hours[1])], months, alreadyThere: false };
}

/** Months between now and a "YYYY-MM" target (≥ 0). */
export function monthsUntil(targetMonth: string, now: Date): number {
  const [year, month] = targetMonth.split("-").map(Number) as [number, number];
  return Math.max(0, (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth()));
}

/** Daily minutes needed to cover the remaining hours before the deadline. */
export function minutesPerDayForDeadline(
  hours: number,
  months: number,
  daysPerWeek: number,
): number | null {
  if (months <= 0) return null;
  const studyDays = months * (52 / 12) * daysPerWeek;
  return Math.ceil((hours * 60) / studyDays);
}
