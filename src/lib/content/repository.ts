import { DEFAULT_DIMENSIONS, type Dimension, type Skill } from "@/lib/learning/skills";
import { CEFR_LEVELS, compareLevels } from "@/lib/learning/cefr";
import {
  courseSchema,
  type Activity,
  type Concept,
  type Course,
  type CourseInput,
  type Lesson,
  type Module,
  type PlacementItem,
  type Scenario,
  type Track,
  type Unit,
} from "./schema";

/**
 * In-memory, read-only index over validated course content. Engines and
 * services depend on this interface, not on where content is stored, so a
 * database-backed CMS can replace the file source later.
 */
export interface LessonRef {
  lesson: Lesson;
  unit: Unit;
  module: Module;
  track: Track;
  /** Position in the track's learning path (0-based). */
  order: number;
}

export interface ActivityRef {
  activity: Activity;
  lessonId: string;
  stepIndex: number;
}

export interface ContentIndex {
  course: Course;
  concepts: ReadonlyMap<string, Concept>;
  modules: ReadonlyMap<string, Module>;
  units: ReadonlyMap<string, { unit: Unit; module: Module }>;
  lessons: ReadonlyMap<string, LessonRef>;
  activities: ReadonlyMap<string, ActivityRef>;
  /** Ordered learning path per track. */
  paths: Readonly<Record<Track, readonly LessonRef[]>>;
  placementItems: ReadonlyMap<string, PlacementItem>;
  placementBySkill: ReadonlyMap<Skill, readonly PlacementItem[]>;
  scenarios: ReadonlyMap<string, Scenario>;
  /** Lessons in which a concept is taught or practised. */
  conceptLessons: ReadonlyMap<string, readonly string[]>;
}

export interface ContentIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export function conceptDimensions(concept: Concept): readonly Dimension[] {
  return concept.dimensions ?? DEFAULT_DIMENSIONS[concept.kind];
}

export function buildContentIndex(input: CourseInput): {
  index?: ContentIndex;
  issues: ContentIssue[];
} {
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((issue) => ({
        severity: "error",
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  const course = parsed.data;
  const issues: ContentIssue[] = [];
  const error = (path: string, message: string) =>
    issues.push({ severity: "error", path, message });
  const warn = (path: string, message: string) =>
    issues.push({ severity: "warning", path, message });

  // Concepts
  const concepts = new Map<string, Concept>();
  for (const concept of course.concepts) {
    if (concepts.has(concept.id)) error(`concepts.${concept.id}`, "duplicate concept id");
    concepts.set(concept.id, concept);
  }
  for (const concept of course.concepts) {
    for (const prerequisite of concept.prerequisites) {
      if (!concepts.has(prerequisite)) {
        error(`concepts.${concept.id}`, `unknown prerequisite ${prerequisite}`);
      }
    }
  }
  const cycle = findPrerequisiteCycle(concepts);
  if (cycle) error("concepts", `prerequisite cycle: ${cycle.join(" → ")}`);

  // Curriculum
  const modules = new Map<string, Module>();
  const units = new Map<string, { unit: Unit; module: Module }>();
  const lessons = new Map<string, LessonRef>();
  const activities = new Map<string, ActivityRef>();
  const conceptLessons = new Map<string, string[]>();
  const paths: Record<Track, LessonRef[]> = { core: [], canada: [], france: [] };
  const scenarios = new Map(course.scenarios.map((scenario) => [scenario.id, scenario]));

  const linkConcept = (conceptId: string, lessonId: string) => {
    const list = conceptLessons.get(conceptId) ?? [];
    if (!list.includes(lessonId)) list.push(lessonId);
    conceptLessons.set(conceptId, list);
  };

  const sortedModules = [...course.modules].sort((a, b) => compareLevels(a.level, b.level));
  for (const courseModule of sortedModules) {
    if (modules.has(courseModule.id)) error(`modules.${courseModule.id}`, "duplicate module id");
    modules.set(courseModule.id, courseModule);
    for (const unit of courseModule.units) {
      const unitPath = `modules.${courseModule.id}.units.${unit.id}`;
      if (units.has(unit.id)) error(unitPath, "duplicate unit id");
      if (unit.level !== courseModule.level)
        error(unitPath, "unit level differs from module level");
      if (unit.track !== courseModule.track)
        error(unitPath, "unit track differs from module track");
      if (unit.missionScenario && !scenarios.has(unit.missionScenario)) {
        error(unitPath, `unknown mission scenario ${unit.missionScenario}`);
      }
      units.set(unit.id, { unit, module: courseModule });
      for (const lesson of unit.lessons) {
        const lessonPath = `${unitPath}.lessons.${lesson.id}`;
        if (lessons.has(lesson.id)) error(lessonPath, "duplicate lesson id");
        const ref: LessonRef = {
          lesson,
          unit,
          module: courseModule,
          track: unit.track,
          order: paths[unit.track].length,
        };
        lessons.set(lesson.id, ref);
        paths[unit.track].push(ref);
        lesson.steps.forEach((activity, stepIndex) => {
          const activityPath = `${lessonPath}.steps.${activity.id}`;
          if (activities.has(activity.id)) error(activityPath, "duplicate activity id");
          activities.set(activity.id, { activity, lessonId: lesson.id, stepIndex });
          if (activity.type === "teach") {
            for (const conceptId of activity.introduces) {
              if (!concepts.has(conceptId)) error(activityPath, `unknown concept ${conceptId}`);
              linkConcept(conceptId, lesson.id);
            }
            return;
          }
          if (activity.targets.length === 0 && activity.type !== "self_assess") {
            error(activityPath, "graded activity needs at least one target");
          }
          for (const target of activity.targets) {
            const concept = concepts.get(target.concept);
            if (!concept) {
              error(activityPath, `unknown concept ${target.concept}`);
              continue;
            }
            if (!conceptDimensions(concept).includes(target.dimension)) {
              warn(
                activityPath,
                `${target.concept} does not track dimension "${target.dimension}" (tracked: ${conceptDimensions(concept).join(", ")})`,
              );
            }
            linkConcept(target.concept, lesson.id);
          }
        });
      }
    }
  }

  // Placement
  const placementItems = new Map<string, PlacementItem>();
  const placementBySkill = new Map<Skill, PlacementItem[]>();
  for (const item of course.placementItems) {
    if (placementItems.has(item.id)) error(`placement.${item.id}`, "duplicate placement item id");
    placementItems.set(item.id, item);
    const list = placementBySkill.get(item.skill) ?? [];
    list.push(item);
    placementBySkill.set(item.skill, list);
  }

  for (const scenario of course.scenarios) {
    for (const conceptId of scenario.keyConcepts) {
      if (!concepts.has(conceptId))
        warn(`scenarios.${scenario.id}`, `unknown concept ${conceptId}`);
    }
  }

  for (const concept of course.concepts) {
    if (!conceptLessons.has(concept.id)) {
      warn(`concepts.${concept.id}`, "concept is not taught or practised in any lesson");
    }
  }

  const authenticIds = new Set<string>();
  for (const entry of course.authentic) {
    if (authenticIds.has(entry.id))
      error(`authentic.${entry.id}`, "duplicate authentic content id");
    authenticIds.add(entry.id);
  }

  if (issues.some((issue) => issue.severity === "error")) return { issues };

  return {
    issues,
    index: {
      course,
      concepts,
      modules,
      units,
      lessons,
      activities,
      paths,
      placementItems,
      placementBySkill,
      scenarios,
      conceptLessons,
    },
  };
}

function findPrerequisiteCycle(concepts: Map<string, Concept>): string[] | undefined {
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (id: string): string[] | undefined => {
    const current = state.get(id);
    if (current === "done") return undefined;
    if (current === "visiting") return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, "visiting");
    stack.push(id);
    for (const prerequisite of concepts.get(id)?.prerequisites ?? []) {
      if (!concepts.has(prerequisite)) continue;
      const cycle = visit(prerequisite);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, "done");
    return undefined;
  };
  for (const id of concepts.keys()) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return undefined;
}

/** All prerequisites of a concept, transitively, nearest first. */
export function prerequisiteClosure(index: ContentIndex, conceptId: string): string[] {
  const seen = new Set<string>();
  const queue = [...(index.concepts.get(conceptId)?.prerequisites ?? [])];
  while (queue.length > 0) {
    const next = queue.shift() as string;
    if (seen.has(next)) continue;
    seen.add(next);
    queue.push(...(index.concepts.get(next)?.prerequisites ?? []));
  }
  return [...seen];
}

/**
 * Concepts a lesson practises without teaching them itself: the learner must
 * have met them before the lesson makes sense.
 */
export function lessonDependencies(ref: LessonRef): string[] {
  const taught = new Set(
    ref.lesson.steps.flatMap((step) => (step.type === "teach" ? step.introduces : [])),
  );
  const practised = ref.lesson.steps.flatMap((step) =>
    step.type === "teach" ? [] : step.targets.map((target) => target.concept),
  );
  return [...new Set(practised.filter((id) => !taught.has(id)))];
}

/** Placement items available per skill and level — used to check bank coverage. */
export function placementCoverage(index: ContentIndex): Record<string, Record<string, number>> {
  const coverage: Record<string, Record<string, number>> = {};
  for (const [skill, items] of index.placementBySkill) {
    coverage[skill] = Object.fromEntries(CEFR_LEVELS.map((level) => [level, 0]));
    for (const item of items) {
      const row = coverage[skill] as Record<string, number>;
      row[item.level] = (row[item.level] ?? 0) + 1;
    }
  }
  return coverage;
}

export interface ConceptLabel {
  text: string;
  lang: "fr" | "pt";
}

/** How a concept is named in the UI: the French form for words, the Portuguese title otherwise. */
export function conceptLabel(concept: Concept | undefined, fallback = ""): ConceptLabel {
  if (!concept) return { text: fallback, lang: "pt" };
  if (concept.kind === "lexical") return { text: concept.french, lang: "fr" };
  return { text: concept.title.pt, lang: "pt" };
}
