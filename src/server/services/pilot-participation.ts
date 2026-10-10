import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { consentSchema, feedbackSchema, PILOT_CONSENT_VERSION } from "@/lib/pilot/schema";
import { localDate, weekStart } from "@/lib/learning/time";
import { db } from "@/server/db";
import { lockLearner } from "./skill-estimation";
import { assertPilotAdmin } from "./pilot";

export class PilotParticipationError extends Error {}
const enabled = () => {
  if (!serverEnv().PILOT_ENABLED)
    throw new PilotParticipationError("O piloto está pausado neste ambiente.");
};
export async function getPilotParticipation(userId: string) {
  return db.pilotParticipant.findUnique({ where: { userId } });
}
export async function requirePilotConsent(
  client: Prisma.TransactionClient,
  userId: string,
  allowFinished = false,
) {
  const participant = await client.pilotParticipant.findUnique({ where: { userId } });
  if (
    !participant?.consentedAt ||
    participant.consentVersion !== PILOT_CONSENT_VERSION ||
    !(participant.status === "active" || (allowFinished && participant.status === "finished"))
  )
    throw new PilotParticipationError("É necessário participar do piloto com o aceite atual.");
  return participant;
}
export async function invitePilotParticipant(adminId: string, input: unknown, now = new Date()) {
  await assertPilotAdmin(adminId);
  enabled();
  const userId = z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,100}$/)
    .parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    if (!(await tx.learnerProfile.findFirst({ where: { userId, onboardedAt: { not: null } } })))
      throw new PilotParticipationError("Aluno com cadastro concluído não encontrado.");
    const previous = await tx.pilotParticipant.findUnique({ where: { userId } });
    if (previous?.status === "active" || previous?.status === "invited") return previous;
    return tx.pilotParticipant.upsert({
      where: { userId },
      create: { userId, invitedAt: now },
      update: { status: "invited", invitedAt: now, finishedAt: null },
    });
  });
}
export async function acceptPilotConsent(userId: string, input: unknown, now = new Date()) {
  enabled();
  consentSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    const previous = await tx.pilotParticipant.findUnique({ where: { userId } });
    if (!previous || !["invited", "active"].includes(previous.status))
      throw new PilotParticipationError("Um convite ativo é necessário para participar.");
    if (previous.status === "active" && previous.consentVersion === PILOT_CONSENT_VERSION)
      return previous;
    return tx.pilotParticipant.update({
      where: { userId },
      data: {
        status: "active",
        consentVersion: PILOT_CONSENT_VERSION,
        consentedAt: now,
        withdrawnAt: null,
      },
    });
  });
}
export async function withdrawPilotConsent(userId: string, now = new Date()) {
  // Withdrawal always works, including during an operational kill switch.
  await db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await tx.pilotFeedback.deleteMany({ where: { userId } });
    await tx.pilotCalibration.deleteMany({ where: { userId } });
    await tx.pilotParticipant.updateMany({
      where: { userId },
      data: { status: "withdrawn", withdrawnAt: now },
    });
  });
}
export async function finishPilotParticipant(adminId: string, userId: string, now = new Date()) {
  await assertPilotAdmin(adminId);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    await requirePilotConsent(tx, userId);
    return tx.pilotParticipant.update({
      where: { userId },
      data: { status: "finished", finishedAt: now },
    });
  });
}
export async function recordPilotFeedback(userId: string, input: unknown, now = new Date()) {
  enabled();
  const data = feedbackSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockLearner(tx, userId);
    const participant = await requirePilotConsent(tx, userId);
    let valid = false;
    if (data.context === "session")
      valid = !!(await tx.dailySession.findFirst({
        where: { id: data.sourceId, userId, startedAt: { gte: participant.consentedAt! } },
        select: { id: true },
      }));
    if (data.context === "conversation")
      valid = !!(await tx.conversation.findFirst({
        where: {
          id: data.sourceId,
          userId,
          status: "ended",
          createdAt: { gte: participant.consentedAt! },
        },
        select: { id: true },
      }));
    if (data.context === "speech")
      valid = !!(await tx.speechAttempt.findFirst({
        where: { id: data.sourceId, userId, createdAt: { gte: participant.consentedAt! } },
        select: { id: true },
      }));
    if (data.context === "weekly") {
      const profile = await tx.learnerProfile.findUnique({
        where: { userId },
        select: { timezone: true },
      });
      valid = data.sourceId === weekStart(localDate(now, profile?.timezone ?? "America/Sao_Paulo"));
    }
    if (!valid)
      throw new PilotParticipationError("Não encontramos uma atividade sua neste piloto.");
    const existing = await tx.pilotFeedback.findUnique({
      where: {
        userId_context_sourceId: { userId, context: data.context, sourceId: data.sourceId },
      },
    });
    if (existing)
      throw new PilotParticipationError("Seu feedback para esta atividade já foi registrado.");
    const midnight = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
    if (await tx.pilotFeedback.count({ where: { userId, createdAt: { gte: midnight } } }))
      throw new PilotParticipationError("Você já deixou um feedback hoje. Obrigado!");
    return tx.pilotFeedback.create({
      data: { ...data, userId, text: data.text || null, createdAt: now },
      select: { id: true, difficulty: true },
    });
  });
}
