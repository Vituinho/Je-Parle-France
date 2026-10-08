import "server-only";
import type { LearnerProfile } from "@/generated/prisma/client";
import { getContent, type LessonRef } from "@/lib/content";
import { levelIndex, type CefrLevel } from "@/lib/learning/cefr";
import { db } from "@/server/db";
import { today } from "./learner";
import { bumpDailyActivity } from "./practice";

/**
 * Shadowing: repeating real dialogue lines right after (or along with) the
 * model voice. Lines come from the listening activities of lessons the
 * learner has already studied, so the words are familiar and the effort goes
 * into rhythm, linking and intonation.
 */
export interface ShadowingLine {
  id: string;
  text: string;
  region: "fr-FR" | "fr-CA";
  gender: "f" | "m";
  lessonTitle: string;
}

const MIN_WORDS = 3;
const MAX_WORDS = 16;
const MAX_LINES = 10;

function linesOf(ref: LessonRef): ShadowingLine[] {
  return ref.lesson.steps.flatMap((step) =>
    step.type === "listening"
      ? step.lines
          .map((line, index) => ({
            id: `${step.id}.${index}`,
            text: line.text,
            region: line.region,
            gender: line.gender,
            lessonTitle: ref.lesson.title.pt,
          }))
          .filter((line) => {
            const words = line.text.split(/\s+/).length;
            return words >= MIN_WORDS && words <= MAX_WORDS;
          })
      : [],
  );
}

export async function getShadowingLines(
  userId: string,
  profile: Pick<LearnerProfile, "destination">,
  level: CefrLevel,
): Promise<ShadowingLine[]> {
  const index = getContent();
  const studied = await db.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
    orderBy: { updatedAt: "desc" },
  });
  const studiedRefs = studied
    .map((row) => index.lessons.get(row.lessonId))
    .filter((ref): ref is LessonRef => ref !== undefined);
  // Beginners without studied dialogues get the first lessons at their level.
  const fallback = index.paths.core.filter(
    (ref) => levelIndex(ref.unit.level) <= levelIndex(level),
  );
  const preferredRegion =
    profile.destination === "canada_quebec"
      ? "fr-CA"
      : profile.destination === "france"
        ? "fr-FR"
        : null;

  const seen = new Set<string>();
  const lines: ShadowingLine[] = [];
  for (const ref of [...studiedRefs, ...fallback]) {
    for (const line of linesOf(ref)) {
      if (seen.has(line.text)) continue;
      seen.add(line.text);
      lines.push(line);
    }
  }
  return lines
    .sort((a, b) => Number(b.region === preferredRegion) - Number(a.region === preferredRegion))
    .slice(0, MAX_LINES);
}

/** Shadowing counts as study and speaking time (bounded per call). */
export async function recordShadowing(
  userId: string,
  profile: Pick<LearnerProfile, "timezone">,
  seconds: number,
) {
  const bounded = Math.max(0, Math.min(1800, Math.round(seconds)));
  if (bounded === 0) return;
  const date = today(profile);
  await db.$transaction(async (tx) => {
    await bumpDailyActivity(tx, userId, date, { seconds: bounded, speaking: bounded });
    await tx.studyEvent.create({
      data: { userId, type: "shadowing_practised", payload: { seconds: bounded } },
    });
  });
}
