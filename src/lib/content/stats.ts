import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { CONCEPT_KINDS } from "@/lib/learning/skills";
import type { ContentIndex } from "./repository";
import { TRACKS } from "./schema";

/** Content inventory for the admin explorer: what exists, per level and path. */
export function contentStats(index: ContentIndex) {
  const conceptsByKind = Object.fromEntries(
    CONCEPT_KINDS.map((kind) => [
      kind,
      Object.fromEntries(
        CEFR_LEVELS.map((level) => [
          level,
          [...index.concepts.values()].filter(
            (concept) => concept.kind === kind && concept.level === level,
          ).length,
        ]),
      ),
    ]),
  ) as Record<(typeof CONCEPT_KINDS)[number], Record<(typeof CEFR_LEVELS)[number], number>>;

  const paths = TRACKS.map((track) => {
    const refs = index.paths[track];
    return {
      track,
      lessons: refs.length,
      activities: refs.reduce((total, ref) => total + ref.lesson.steps.length, 0),
      minutes: refs.reduce((total, ref) => total + ref.lesson.minutes, 0),
    };
  });

  const activityTypes = new Map<string, number>();
  for (const { activity } of index.activities.values()) {
    activityTypes.set(activity.type, (activityTypes.get(activity.type) ?? 0) + 1);
  }

  const untaught = [...index.concepts.keys()].filter((id) => !index.conceptLessons.has(id));

  return {
    concepts: index.concepts.size,
    conceptsByKind,
    paths,
    activityTypes: [...activityTypes.entries()].sort((a, b) => b[1] - a[1]),
    placementItems: index.placementItems.size,
    scenarios: index.scenarios.size,
    untaught,
  };
}
