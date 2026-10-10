import { learningEventSchema } from "@/lib/learning/telemetry/events";
import { localDate } from "@/lib/learning/time";
import { DIFFICULTY_LABELS } from "./schema";

/** Descriptive only: no thresholds, mastery, estimates or plans are changed. */
export function pilotObservations(input: {
  timezone: string;
  events: readonly { type: string; payload: unknown; createdAt: Date }[];
  feedback: readonly {
    context: string;
    difficulty: keyof typeof DIFFICULTY_LABELS;
    createdAt: Date;
  }[];
}) {
  const days = new Set<string>(),
    introduced = new Set<string>(),
    strengthened = new Set<string>();
  let activeMs = 0;
  const timeline: { at: Date; type: string; metadata: unknown }[] = [];
  const rank = ["unseen", "introduced", "learning", "decaying", "familiar", "strong", "mastered"];
  for (const row of input.events) {
    const parsed = learningEventSchema.safeParse({ type: row.type, payload: row.payload });
    if (!parsed.success) continue;
    const event = parsed.data;
    if (event.type === "active_time") {
      activeMs += event.payload.activeMs;
      if (event.payload.activeMs > 0) days.add(localDate(row.createdAt, input.timezone));
    }
    if (event.type === "activity_completed")
      for (const m of event.payload.masteryChanges) {
        if (m.before === "unseen" && m.after !== "unseen") introduced.add(m.conceptId);
        if (
          rank.indexOf(m.after) > rank.indexOf(m.before) &&
          ["familiar", "strong", "mastered"].includes(m.after)
        )
          strengthened.add(m.conceptId);
      }
    if (event.type !== "active_time")
      timeline.push({ at: row.createdAt, type: event.type, metadata: event.payload });
  }
  const difficulty = Object.keys(DIFFICULTY_LABELS).map((key) => ({
    difficulty: key as keyof typeof DIFFICULTY_LABELS,
    samples: input.feedback.filter((f) => f.difficulty === key).length,
  }));
  for (const f of input.feedback)
    timeline.push({
      at: f.createdAt,
      type: "pilot_feedback",
      metadata: { context: f.context, difficulty: f.difficulty },
    });
  return {
    activeDays: days.size,
    activeSeconds: Math.floor(activeMs / 1000),
    introduced: introduced.size,
    strengthened: strengthened.size,
    difficulty,
    timeline: timeline.sort((a, b) => b.at.getTime() - a.at.getTime()),
    interpretation:
      "Tempo estimado e percepção apoiam a revisão humana. Amostras pequenas, seleção de participantes e prática desigual impedem atribuir eficácia ou causalidade. Nenhum ajuste automático foi realizado.",
  };
}
