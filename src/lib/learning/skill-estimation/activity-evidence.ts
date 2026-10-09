import type { Activity } from "@/lib/content/schema";
import type { GradeResult, ActivityResponse } from "../grading/grade";
import { levelMidpoint, type CefrLevel } from "../cefr";
import type { ConceptKind, Skill } from "../skills";
import type { WritingAssessment } from "../writing/assessment";
import type { SkillEvidence } from "./estimate";

/** Evidence scope is activity-specific. Knowing a word is not reading or speaking proficiency. */
export function activityEvidence(params: {
  activity: Activity;
  grade: GradeResult;
  response: ActivityResponse;
  now: Date;
  level: CefrLevel;
  context: "lesson" | "review" | "session" | "lab";
  hinted?: boolean;
  concepts: ReadonlyMap<string, { kind: ConceptKind; level: CefrLevel }>;
  speechProof?: string;
  writing?: WritingAssessment;
}): SkillEvidence[] {
  const { activity, grade, now } = params;
  if (
    activity.type === "teach" ||
    activity.type === "self_assess" ||
    grade.selfRated ||
    grade.verdict === "recorded"
  )
    return [];
  const targets = [...new Set(activity.targets.map((t) => t.concept))].slice(0, 30);
  const results = new Map<Skill, SkillEvidence>();
  const key = `${activity.id}:${now.toISOString().slice(0, 10)}`;
  const add = (
    skill: Skill,
    quality: number,
    substantial: boolean,
    extra: Partial<SkillEvidence> = {},
  ) => {
    const row: SkillEvidence = {
      key,
      taskId: activity.id,
      skill,
      difficulty: levelMidpoint(params.level),
      score: grade.score,
      confidence: params.hinted ? 0.25 : 1,
      quality,
      substantial,
      guess: 0,
      occurredAt: now,
      concepts: targets,
      source: params.context === "review" ? "review" : "lesson",
      assessment: "deterministic",
      ...extra,
    };
    if (params.context === "review")
      row.taskId = `review:${activity.type}:${targets.join(",")}`.slice(0, 180);
    results.set(skill, row);
  };
  if (activity.type === "reading" || activity.type === "listening") {
    add(activity.type === "reading" ? "reading" : "listening", 1, true, {
      guess:
        activity.questions.reduce((sum, q) => sum + 1 / q.options.length, 0) /
        activity.questions.length,
    });
  } else if (activity.type === "minimal_pair") add("listening", 0.3, false, { guess: 0.5 });
  else if (activity.type === "dictation") add("listening", 0.5, false);
  else if (activity.type === "speak") {
    // Only a server-resolved assessment can supply these fields. Self-ratings were excluded above.
    if (
      !params.speechProof ||
      params.response.kind !== "speech" ||
      params.response.pronunciation === undefined
    )
      return [];
    const extra: Partial<SkillEvidence> = {
      key: `speech:${params.speechProof}`,
      source: "speech",
      assessment: "provider",
    };
    add("pronunciation", 0.8, true, { ...extra, score: params.response.pronunciation / 100 });
    add("speaking", 0.55, activity.mode === "respond", extra);
  } else if (activity.type === "open_writing") {
    const writing = params.writing;
    if (!writing || writing.score === null || writing.method !== "ai_assessment") return [];
    add("writing", writing.quality, true, {
      confidence: writing.confidence * (params.hinted ? 0.25 : 1),
      source: "writing",
      assessment: "ai",
    });
  } else {
    const kinds = new Set(targets.map((id) => params.concepts.get(id)?.kind));
    const guess = activity.type === "choice" ? 1 / activity.options.length : 0;
    if (kinds.has("lexical"))
      add("vocabulary", activity.type === "type" ? 0.6 : 0.4, activity.type === "type", { guess });
    if (kinds.has("grammar")) add("grammar", 0.7, true, { guess });
    if (["type", "fill", "order", "error_correction"].includes(activity.type))
      add("writing", 0.25, false);
  }
  return [...results.values()];
}
