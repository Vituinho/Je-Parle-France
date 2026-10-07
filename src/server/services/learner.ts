import "server-only";
import { cache } from "react";
import type { LearnerProfile } from "@/generated/prisma/client";
import { readTheta, type CefrLevel } from "@/lib/learning/cefr";
import { supportMode, type SupportMode } from "@/lib/learning/language-support";
import { SKILLS, type Skill } from "@/lib/learning/skills";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";

export interface SkillState {
  theta: number;
  sd: number;
  assessed: boolean;
}

export interface LearnerLevel {
  theta: number;
  level: CefrLevel;
  skills: Record<Skill, SkillState>;
}

/** Skills that define the overall level (receptive + knowledge, measured objectively). */
const CORE_SKILLS: Skill[] = ["reading", "listening", "vocabulary", "grammar"];

export const getLearnerLevel = cache(async (userId: string): Promise<LearnerLevel> => {
  const rows = await db.skillEstimate.findMany({ where: { userId } });
  const skills = Object.fromEntries(
    SKILLS.map((skill) => {
      const row = rows.find((r) => r.skill === skill);
      return [
        skill,
        { theta: row?.theta ?? 0.2, sd: row?.sd ?? 1, assessed: row?.assessed ?? false },
      ];
    }),
  ) as Record<Skill, SkillState>;
  const theta =
    CORE_SKILLS.reduce((sum, skill) => sum + skills[skill].theta, 0) / CORE_SKILLS.length;
  return { theta, level: readTheta(theta).level, skills };
});

export function supportFor(
  level: CefrLevel,
  profile: Pick<LearnerProfile, "supportPreference">,
): SupportMode {
  return supportMode(level, profile.supportPreference);
}

export function today(profile: Pick<LearnerProfile, "timezone">, now = new Date()): string {
  return localDate(now, profile.timezone);
}
