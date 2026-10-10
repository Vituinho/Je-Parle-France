import "server-only";
import { observeProvider } from "./provider-telemetry";
import type { Prisma } from "@/generated/prisma/client";
import { getLLM, LLMUnavailableError, type LLMMessage } from "@/lib/ai/llm";
import { getContent } from "@/lib/content";
import { readTheta } from "@/lib/learning/cefr";
import { detectErrors } from "@/lib/learning/errors/patterns";
import { applyReview, MASTERY_VALUE, masteryOf } from "@/lib/learning/memory/memory";
import {
  buildReportSystemPrompt,
  boundedConversation,
  buildTutorSystemPrompt,
  clampScores,
  markSpoken,
  mergeCorrections,
  transcriptForReport,
  tutorReportSchema,
  tutorTurnSchema,
  visibleCorrections,
  type CorrectionMode,
  type StoredReport,
  type TutorContext,
  type TutorCorrection,
} from "@/lib/learning/tutor/tutor";
import type { Dimension } from "@/lib/learning/skills";
import { serverEnv } from "@/lib/env";
import { db } from "@/server/db";
import { loadTraces, saveReviewLogs, saveTraces, traceFromRow } from "@/server/repositories/memory";
import { consumeQuota, QuotaError, throttle, addUsageUnits } from "@/server/quota";
import { getLearnerLevel, today } from "./learner";

export class TutorError extends Error {}

export const MAX_MESSAGE_LENGTH = 500;

const DEFAULT_OPENINGS: Record<string, string> = {
  A0: "Bonjour ! Je m'appelle Camille. Et vous, comment vous appelez-vous ?",
  A1: "Bonjour ! Je m'appelle Camille. Vous habitez où ?",
  A2: "Salut ! Qu'est-ce que tu as fait ce week-end ?",
  B1: "Salut ! Alors, quoi de neuf depuis la dernière fois ?",
  B2: "Bonjour ! J'ai envie de discuter d'un sujet d'actualité. Qu'est-ce qui t'intéresse en ce moment ?",
  C1: "Bonjour ! Si vous deviez convaincre un ami de s'installer au Québec, quels arguments donneriez-vous ?",
};

async function profileOf(userId: string) {
  const profile = await db.learnerProfile.findUnique({ where: { userId } });
  if (!profile) throw new TutorError("Complete o cadastro primeiro.");
  return profile;
}

/** What the tutor needs to know about the learner — built from real mastery data. */
async function tutorContext(
  userId: string,
  correctionMode: CorrectionMode,
  scenarioId: string | null,
): Promise<TutorContext> {
  const content = getContent();
  const [profile, level, traces, personal] = await Promise.all([
    profileOf(userId),
    getLearnerLevel(userId),
    db.memoryTrace
      .findMany({ where: { userId }, orderBy: { lastReview: "desc" }, take: 120 })
      .then((rows) => rows.map(traceFromRow)),
    db.personalItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const now = new Date();
  const known = new Set<string>();
  const weak = new Set<string>();
  for (const trace of traces) {
    const concept = content.concepts.get(trace.conceptId);
    if (concept?.kind !== "lexical") continue;
    const state = masteryOf(trace, now);
    if (MASTERY_VALUE[state] >= MASTERY_VALUE.familiar) known.add(concept.french);
    if (
      trace.lapses > 0 ||
      state === "decaying" ||
      (trace.attempts > 0 && trace.lastScore !== null && trace.lastScore < 0.5)
    ) {
      weak.add(concept.french);
    }
  }
  const scenario = scenarioId ? content.scenarios.get(scenarioId) : undefined;
  return {
    level: level.level,
    theta: level.theta,
    destination: profile.destination,
    correctionMode,
    scenario: scenario
      ? {
          title: scenario.title.pt,
          setting: scenario.setting.pt,
          aiRole: scenario.aiRole,
          learnerGoal: scenario.learnerGoal.pt,
          region: scenario.region,
        }
      : undefined,
    knownVocabulary: [...known].slice(0, 60),
    weakItems: [...weak].slice(0, 10),
    recentMistakes: personal.map(
      (item) => `${(item.wrong ?? "?").slice(0, 150)} → ${item.french.slice(0, 150)}`,
    ),
  };
}

/**
 * A deterministic error in a tutor message is evidence against the course
 * concept it breaks: a failed review on the dimension used (writing, or
 * speaking for a spoken turn), so the concept comes back in reviews. Only
 * concepts the learner has already met are touched — the tutor does not
 * schedule what the course has not taught yet. AI-model corrections are not
 * used here: they carry no concept id and can be wrong.
 */
async function mistakeEvidence(userId: string, conceptIds: string[], dimension: Dimension) {
  const unique = [...new Set(conceptIds)];
  if (unique.length === 0) return [];
  const traces = await loadTraces(db, userId, unique);
  const now = new Date();
  return unique.flatMap((conceptId) => {
    // Spoken turns fall back to writing when the concept has no speaking trace.
    const trace =
      traces.find((t) => t.conceptId === conceptId && t.dimension === dimension) ??
      traces.find((t) => t.conceptId === conceptId && t.dimension === "writing");
    if (!trace) return [];
    return [
      applyReview({
        trace,
        conceptId,
        dimension: trace.dimension,
        outcome: { score: 0, correct: false, verdict: "wrong" },
        now,
        source: "tutor",
      }),
    ];
  });
}

export async function startConversation(
  userId: string,
  options: { scenarioId?: string; correctionMode?: CorrectionMode },
) {
  if (!serverEnv().TUTOR_ENABLED)
    throw new TutorError("Tutor pausado neste ambiente. Você pode continuar as lições e revisões.");
  const profile = await profileOf(userId);
  const level = await getLearnerLevel(userId);
  const scenario = options.scenarioId ? getContent().scenarios.get(options.scenarioId) : undefined;
  if (options.scenarioId && !scenario) throw new TutorError("Cenário não encontrado.");
  const opening = scenario?.openingLine ?? DEFAULT_OPENINGS[level.level] ?? DEFAULT_OPENINGS.A1!;
  await consumeQuota(
    userId,
    "tutor-conversation",
    today(profile),
    serverEnv().TUTOR_DAILY_CONVERSATIONS,
  );
  const conversation = await db.conversation.create({
    data: {
      userId,
      scenarioId: scenario?.id ?? null,
      correctionMode: options.correctionMode ?? profile.correctionMode,
      level: readTheta(level.theta).level,
      turns: { create: [{ role: "tutor", content: opening }] },
    },
  });
  await db.studyEvent.create({
    data: { userId, type: "conversation_started", payload: { scenarioId: scenario?.id ?? null } },
  });
  return conversation;
}

export async function getConversation(userId: string, conversationId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { turns: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new TutorError("Conversa não encontrada.");
  return conversation;
}

export async function listConversations(userId: string, take = 20) {
  return db.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { _count: { select: { turns: true } } },
  });
}

export interface StoredCorrections {
  all: TutorCorrection[];
  visible: TutorCorrection[];
}

export interface TurnResult {
  learner: { id: string; content: string; corrections: TutorCorrection[] };
  tutor: { id: string; content: string };
  simulated: boolean;
}

export async function sendLearnerMessage(
  userId: string,
  conversationId: string,
  rawText: string,
  options: { spoken?: boolean } = {},
): Promise<TurnResult> {
  if (!serverEnv().TUTOR_ENABLED)
    throw new TutorError("Tutor pausado. Você pode encerrar esta conversa e continuar estudando.");
  const text = rawText.trim();
  if (!text) throw new TutorError("Escreva uma mensagem.");
  if (text.length > MAX_MESSAGE_LENGTH)
    throw new TutorError(`Use no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
  if (!throttle(userId, "tutor-turn", 1500))
    throw new TutorError("Espere um instante antes de enviar outra mensagem.");

  const conversation = await getConversation(userId, conversationId);
  if (conversation.status !== "active") throw new TutorError("Esta conversa já terminou.");
  const profile = await profileOf(userId);
  const date = today(profile);
  await consumeQuota(userId, "tutor-turn", date, serverEnv().TUTOR_DAILY_TURNS);

  const mode = conversation.correctionMode as CorrectionMode;
  const context = await tutorContext(userId, mode, conversation.scenarioId);
  const history: LLMMessage[] = boundedConversation(conversation.turns).map((turn) => ({
    role: turn.role === "tutor" ? "assistant" : "user",
    content: turn.content,
  }));
  // The API expects the conversation to start with a user turn.
  const messages: LLMMessage[] = [
    { role: "user", content: "(Início da conversa.)" },
    ...history,
    { role: "user", content: options.spoken ? markSpoken(text) : text },
  ];

  const llm = getLLM();
  const result = await observeProvider(
    userId,
    { provider: llm.id, operation: "tutor_turn", simulated: llm.simulated },
    () =>
      llm.generateObject({
        system: buildTutorSystemPrompt(context),
        messages,
        schema: tutorTurnSchema,
        purpose: "tutor_turn",
        effort: "low",
        maxTokens: 2000,
      }),
    (result) => result.usage,
  );
  await addUsageUnits(
    userId,
    "tutor-turn",
    date,
    result.usage.inputTokens + result.usage.outputTokens,
  );

  const detected = detectErrors(text);
  const corrections = mergeCorrections(result.object.corrections, detected);
  const stored: StoredCorrections = {
    all: corrections,
    visible: visibleCorrections(corrections, mode),
  };
  const reply = result.object.reply.trim().slice(0, 1200) || "Pardon, vous pouvez répéter ?";
  const evidence = await mistakeEvidence(
    userId,
    detected.flatMap((error) => error.concepts),
    options.spoken ? "speaking" : "writing",
  );

  const [learnerTurn, tutorTurn] = await db.$transaction(async (tx) => {
    const learner = await tx.conversationTurn.create({
      data: {
        conversationId,
        role: "learner",
        content: text,
        corrections: stored as unknown as Prisma.InputJsonValue,
      },
    });
    const tutor = await tx.conversationTurn.create({
      data: { conversationId, role: "tutor", content: reply },
    });
    if (options.spoken && conversation.mode !== "voice") {
      await tx.conversation.update({ where: { id: conversationId }, data: { mode: "voice" } });
    }
    await saveTraces(
      tx,
      userId,
      evidence.map((entry) => entry.trace),
    );
    await saveReviewLogs(
      tx,
      userId,
      evidence.flatMap((entry) => (entry.log ? [entry.log] : [])),
    );
    return [learner, tutor] as const;
  });
  return {
    learner: { id: learnerTurn.id, content: text, corrections: stored.visible },
    tutor: { id: tutorTurn.id, content: reply },
    simulated: result.simulated,
  };
}

/**
 * Ends a conversation: a structured report and, for the important corrections,
 * personal review items so the mistakes come back in future reviews.
 */
export async function endConversation(
  userId: string,
  conversationId: string,
): Promise<StoredReport> {
  const conversation = await getConversation(userId, conversationId);
  if (conversation.status === "ended" && conversation.report)
    return conversation.report as unknown as StoredReport;

  const learnerTurns = conversation.turns.filter((turn) => turn.role === "learner");
  const allCorrections = learnerTurns.flatMap(
    (turn) => (turn.corrections as unknown as StoredCorrections | null)?.all ?? [],
  );
  const profile = await profileOf(userId);
  const date = today(profile);
  let report: StoredReport;

  if (learnerTurns.length === 0) {
    report = {
      scores: { fluency: 0, vocabulary: 0, grammar: 0, comprehension: 0 },
      pronunciation: null,
      summaryPt: "A conversa terminou antes de você escrever. Tente de novo quando quiser!",
      strengths: [],
      corrections: [],
      nextSteps: [],
      simulated: false,
      learnerTurns: 0,
    };
  } else {
    const level = await getLearnerLevel(userId);
    const llm = getLLM();
    try {
      if (!serverEnv().TUTOR_ENABLED)
        throw new LLMUnavailableError("Tutor pausado.", "unavailable");
      await consumeQuota(userId, "tutor-report", date, serverEnv().TUTOR_DAILY_REPORTS);
      const result = await observeProvider(
        userId,
        { provider: llm.id, operation: "tutor_report", simulated: llm.simulated },
        () =>
          llm.generateObject({
            system: buildReportSystemPrompt({ level: level.level, theta: level.theta }),
            messages: [
              {
                role: "user",
                content: transcriptForReport(
                  conversation.turns.map((turn) => ({ role: turn.role, content: turn.content })),
                  allCorrections,
                ),
              },
            ],
            schema: tutorReportSchema,
            purpose: "tutor_report",
            effort: "medium",
            maxTokens: 4000,
          }),
        (result) => result.usage,
      );
      await addUsageUnits(
        userId,
        "tutor-report",
        date,
        result.usage.inputTokens + result.usage.outputTokens,
      );
      report = {
        ...clampScores(result.object),
        pronunciation: null,
        simulated: result.simulated,
        learnerTurns: learnerTurns.length,
      };
    } catch (error) {
      if (!(error instanceof LLMUnavailableError) && !(error instanceof QuotaError)) throw error;
      // Fall back to what was collected during the conversation.
      report = {
        scores: { fluency: 0, vocabulary: 0, grammar: 0, comprehension: 0 },
        pronunciation: null,
        summaryPt:
          "Não foi possível gerar o relatório completo agora. Estas são as correções anotadas durante a conversa.",
        strengths: [],
        corrections: allCorrections
          .slice(0, 5)
          .map(({ wrong, right, explanationPt }) => ({ wrong, right, explanationPt })),
        nextSteps: [],
        simulated: false,
        learnerTurns: learnerTurns.length,
      };
    }
  }

  // Important corrections become personal review items (deduplicated per learner).
  const important = [
    ...report.corrections,
    ...allCorrections.filter((c) => c.severity === "important"),
  ].filter(
    (c, index, list) =>
      list.findIndex((other) => other.right.toLowerCase() === c.right.toLowerCase()) === index,
  );
  const existing = await db.personalItem.findMany({
    where: { userId, french: { in: important.map((c) => c.right) } },
    select: { french: true },
  });
  const known = new Set(existing.map((item) => item.french.toLowerCase()));
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversationId },
      data: { status: "ended", endedAt: now, report: report as unknown as Prisma.InputJsonValue },
    });
    for (const correction of important.slice(0, 5)) {
      if (known.has(correction.right.toLowerCase())) continue;
      const item = await tx.personalItem.create({
        data: {
          userId,
          kind: "correction",
          french: correction.right,
          wrong: correction.wrong,
          explanation: correction.explanationPt,
          conversationId,
        },
      });
      const reviews = (["recognition", "writing"] as const).map((dimension) =>
        applyReview({
          trace: null,
          conceptId: `personal:${item.id}`,
          dimension,
          outcome: { score: 0, correct: false, verdict: "wrong" },
          now,
          source: "tutor",
        }),
      );
      await saveTraces(
        tx,
        userId,
        reviews.map((review) => review.trace),
      );
      await saveReviewLogs(
        tx,
        userId,
        reviews.flatMap((review) => (review.log ? [review.log] : [])),
      );
    }
    await tx.studyEvent.create({
      data: {
        userId,
        type: "conversation_completed",
        payload: { conversationId, learnerTurns: learnerTurns.length, simulated: report.simulated },
      },
    });
  });
  return report;
}

export async function deleteConversation(userId: string, conversationId: string) {
  await db.conversation.deleteMany({ where: { id: conversationId, userId } });
}

export { QuotaError };
