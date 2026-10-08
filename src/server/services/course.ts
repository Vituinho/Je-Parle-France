import "server-only";
import type { LearnerProfile } from "@/generated/prisma/client";
import { getContent, lessonDependencies, type LessonRef } from "@/lib/content";
import type { Track } from "@/lib/content/schema";
import { db } from "@/server/db";

/**
 * The course map: every path (core and destination tracks) with the learner's
 * status per lesson. Lessons are always browsable; "locked" only marks track
 * lessons that practise something the learner has not met yet.
 */
export type LessonState = "completed" | "in_progress" | "skipped" | "new" | "locked";

export interface MapLesson {
  id: string;
  title: string;
  objective: string;
  minutes: number;
  state: LessonState;
}

export interface MapUnit {
  id: string;
  level: string;
  title: { pt: string; fr?: string };
  canDo: string;
  mission: { id: string; title: string } | null;
  lessons: MapLesson[];
}

export interface MapTrack {
  track: Track;
  units: MapUnit[];
  completed: number;
  total: number;
}

export async function getCourseMap(
  userId: string,
  profile: Pick<LearnerProfile, "startLessonId" | "placementStatus">,
): Promise<MapTrack[]> {
  const index = getContent();
  const [progress, traced] = await Promise.all([
    db.lessonProgress.findMany({ where: { userId }, select: { lessonId: true, status: true } }),
    db.memoryTrace.findMany({
      where: { userId },
      select: { conceptId: true },
      distinct: ["conceptId"],
    }),
  ]);
  const status = new Map(progress.map((row) => [row.lessonId, row.status]));
  const met = new Set(traced.map((row) => row.conceptId));
  const startOrder = profile.startLessonId
    ? (index.lessons.get(profile.startLessonId)?.order ?? 0)
    : 0;

  const stateOf = (ref: LessonRef): LessonState => {
    const current = status.get(ref.lesson.id);
    if (current === "completed") return "completed";
    if (current === "in_progress") return "in_progress";
    // Lessons before a placement-chosen start are covered by the diagnosis.
    if (ref.track === "core" && profile.placementStatus === "completed" && ref.order < startOrder) {
      return "skipped";
    }
    if (ref.track !== "core" && !lessonDependencies(ref).every((id) => met.has(id))) {
      return "locked";
    }
    return "new";
  };

  return (["core", "canada", "france"] as const).map((track) => {
    const units: MapUnit[] = [];
    for (const ref of index.paths[track]) {
      let unit = units.at(-1);
      if (unit?.id !== ref.unit.id) {
        const scenario = ref.unit.missionScenario
          ? index.scenarios.get(ref.unit.missionScenario)
          : undefined;
        unit = {
          id: ref.unit.id,
          level: ref.unit.level,
          title: ref.unit.title,
          canDo: ref.unit.canDo.pt,
          mission: scenario ? { id: scenario.id, title: scenario.title.pt } : null,
          lessons: [],
        };
        units.push(unit);
      }
      unit.lessons.push({
        id: ref.lesson.id,
        title: ref.lesson.title.pt,
        objective: ref.lesson.objective.pt,
        minutes: ref.lesson.minutes,
        state: stateOf(ref),
      });
    }
    const lessons = units.flatMap((unit) => unit.lessons);
    return {
      track,
      units,
      completed: lessons.filter((lesson) => lesson.state === "completed").length,
      total: lessons.length,
    };
  });
}
