import "server-only";
import { conceptDimensions, getContent } from "@/lib/content";
import { distinctFrench } from "@/lib/content/localized";
import type { GrammarConcept, LexicalConcept } from "@/lib/content/schema";
import { MASTERY_VALUE, masteryOf, type MasteryState } from "@/lib/learning/memory/memory";
import type { Dimension } from "@/lib/learning/skills";
import { db } from "@/server/db";
import { loadTraces } from "@/server/repositories/memory";

/**
 * Read models for the learner's notebook (vocabulary) and the grammar
 * library. Everything stays connected to learning: mastery per dimension,
 * next review, and the lesson where the item was taught.
 */
export interface DimensionState {
  dimension: Dimension;
  state: MasteryState;
}

export interface NotebookWord {
  conceptId: string;
  french: string;
  meaning: string;
  pos: LexicalConcept["pos"];
  gender?: "m" | "f" | "mf";
  plural?: string;
  ipa?: string;
  level: string;
  register: LexicalConcept["register"];
  example?: { fr: string; pt: string };
  verb?: LexicalConcept["verb"];
  falseFriend?: LexicalConcept["falseFriend"];
  tags: string[];
  dimensions: DimensionState[];
  overall: MasteryState;
  nextReview: string | null;
  lesson: { id: string; title: string } | null;
}

export interface NotebookCorrection {
  id: string;
  wrong: string | null;
  right: string;
  explanation: string | null;
  createdAt: string;
  state: MasteryState;
  nextReview: string | null;
}

function weakest(states: MasteryState[]): MasteryState {
  const practised = states.filter((state) => state !== "unseen");
  if (practised.length === 0) return "unseen";
  return practised.reduce((min, state) =>
    MASTERY_VALUE[state] < MASTERY_VALUE[min] ? state : min,
  );
}

export async function getNotebook(userId: string, now = new Date()) {
  const content = getContent();
  const [traces, personal] = await Promise.all([
    loadTraces(db, userId),
    db.personalItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  const byConcept = new Map<string, typeof traces>();
  for (const trace of traces) {
    const list = byConcept.get(trace.conceptId) ?? [];
    list.push(trace);
    byConcept.set(trace.conceptId, list);
  }

  const words: NotebookWord[] = [];
  for (const [conceptId, own] of byConcept) {
    const concept = content.concepts.get(conceptId);
    if (concept?.kind !== "lexical") continue;
    const dimensions = conceptDimensions(concept).map((dimension) => ({
      dimension,
      state: masteryOf(
        own.find((trace) => trace.dimension === dimension),
        now,
      ),
    }));
    const practised = own.filter((trace) => trace.reps > 0);
    const next = practised.map((trace) => trace.due.getTime()).sort((a, b) => a - b)[0];
    const lessonId = content.conceptLessons.get(conceptId)?.[0];
    const lesson = lessonId ? content.lessons.get(lessonId) : undefined;
    words.push({
      conceptId,
      french: concept.french,
      meaning: concept.meaning,
      pos: concept.pos,
      gender: concept.gender,
      plural: concept.plural,
      ipa: concept.ipa,
      level: concept.level,
      register: concept.register,
      example: concept.examples[0],
      verb: concept.verb,
      falseFriend: concept.falseFriend,
      tags: concept.tags,
      dimensions,
      overall: weakest(dimensions.map((d) => d.state)),
      nextReview: next ? new Date(next).toISOString() : null,
      lesson: lesson ? { id: lesson.lesson.id, title: lesson.lesson.title.pt } : null,
    });
  }
  words.sort((a, b) => a.french.localeCompare(b.french, "fr"));

  const corrections: NotebookCorrection[] = personal.map((item) => {
    const own = byConcept.get(`personal:${item.id}`) ?? [];
    const practised = own.filter((trace) => trace.reps > 0);
    const next = practised.map((trace) => trace.due.getTime()).sort((a, b) => a - b)[0];
    return {
      id: item.id,
      wrong: item.wrong,
      right: item.french,
      explanation: item.explanation,
      createdAt: item.createdAt.toISOString(),
      state: weakest(own.map((trace) => masteryOf(trace, now))),
      nextReview: next ? new Date(next).toISOString() : null,
    };
  });

  return { words, corrections };
}

export const grammarSlug = (conceptId: string) => conceptId.replace("gram:", "");

export function grammarTopics(): GrammarConcept[] {
  return [...getContent().concepts.values()].filter(
    (concept): concept is GrammarConcept => concept.kind === "grammar",
  );
}

export interface GrammarTopicSummary {
  slug: string;
  level: string;
  title: { pt: string; fr?: string };
  summary: string;
  state: MasteryState;
}

export async function getGrammarLibrary(
  userId: string,
  now = new Date(),
): Promise<GrammarTopicSummary[]> {
  const topics = grammarTopics();
  const traces = await loadTraces(
    db,
    userId,
    topics.map((topic) => topic.id),
  );
  return topics
    .map((topic) => ({
      slug: grammarSlug(topic.id),
      level: topic.level,
      title: { pt: topic.title.pt, fr: distinctFrench(topic.title) },
      summary: topic.summary.pt,
      state: weakest(
        traces
          .filter((trace) => trace.conceptId === topic.id)
          .map((trace) => masteryOf(trace, now)),
      ),
    }))
    .sort((a, b) => a.level.localeCompare(b.level) || a.title.pt.localeCompare(b.title.pt, "pt"));
}

export async function getGrammarTopic(userId: string, slug: string, now = new Date()) {
  const content = getContent();
  const concept = content.concepts.get(`gram:${slug}`);
  if (!concept || concept.kind !== "grammar") return null;
  const traces = await loadTraces(db, userId, [concept.id]);
  const dimensions = conceptDimensions(concept).map((dimension) => ({
    dimension,
    state: masteryOf(
      traces.find((trace) => trace.dimension === dimension),
      now,
    ),
  }));
  const lessons = (content.conceptLessons.get(concept.id) ?? [])
    .map((id) => content.lessons.get(id))
    .filter((ref) => ref !== undefined)
    .map((ref) => ({ id: ref.lesson.id, title: ref.lesson.title.pt, unit: ref.unit.title.pt }));
  const related = [
    ...concept.prerequisites,
    ...[...content.concepts.values()]
      .filter((other) => other.prerequisites.includes(concept.id))
      .map((other) => other.id),
  ]
    .map((id) => content.concepts.get(id))
    .filter((other): other is GrammarConcept => other?.kind === "grammar")
    .map((other) => ({ slug: grammarSlug(other.id), title: other.title.pt }));
  return { concept, dimensions, lessons, related };
}
