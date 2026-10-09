import "server-only";
import { cache } from "react";
import type { EstimateMethod, LearnerProfile, Prisma } from "@/generated/prisma/client";
import { CEFR_LEVELS, levelIndex, readTheta, type CefrLevel } from "@/lib/learning/cefr";
import {
  estimateLabel,
  estimateExplanation,
  type EstimateReason,
} from "@/lib/learning/skill-estimation/estimate";
import { supportMode, type SupportMode } from "@/lib/learning/language-support";
import { SKILLS, type Skill } from "@/lib/learning/skills";
import { localDate } from "@/lib/learning/time";
import { db } from "@/server/db";

export interface SkillState {
  theta: number;
  sd: number;
  assessed: boolean;
  /** How the estimate was obtained (measured, self-assessed, self-reported…). */
  method: EstimateMethod;
  level: CefrLevel;
  label: string;
  confidence: "high" | "medium" | "low";
  explanation: string;
  evidenceCount: number;
  evidenceDays: number;
  displayTheta: number;
}

export interface LearnerLevel {
  theta: number;
  level: CefrLevel;
  skills: Record<Skill, SkillState>;
}

/** Skills that define the overall level (receptive + knowledge, measured objectively). */
const CORE_SKILLS: Skill[] = ["reading", "listening", "vocabulary", "grammar"];

export const getLearnerLevel = cache(
  async (userId: string, client: Prisma.TransactionClient = db): Promise<LearnerLevel> => {
    const rows = await client.skillEstimate.findMany({ where: { userId } });
    const skills = Object.fromEntries(
      SKILLS.map((skill) => {
        const row = rows.find((r) => r.skill === skill);
        const theta = row?.theta ?? 0.2;
        const bandIndex = row?.displayBand ?? levelIndex(readTheta(theta).level);
        const band = CEFR_LEVELS[bandIndex] ?? "A0";
        const reason = (row?.reason ?? "calibration") as EstimateReason;
        const summary = {
          band,
          reason,
          evidenceCount: row?.evidenceCount ?? 0,
          evidenceDays: row?.evidenceDays ?? 0,
        };
        const assessed = row?.assessed ?? false;
        const method = row?.method ?? "self_report";
        const measured = assessed && (method === "objective" || method === "perception");
        const confirmedAt = row?.lastEvidenceAt ?? row?.calibratedAt ?? row?.updatedAt;
        const stale = !!confirmedAt && Date.now() - confirmedAt.getTime() > 90 * 86_400_000;
        return [
          skill,
          {
            theta: row?.theta ?? 0.2,
            sd: row?.sd ?? 1,
            assessed: row?.assessed ?? false,
            method: row?.method ?? "self_report",
            level: band,
            label:
              method === "not_assessed"
                ? "a confirmar"
                : method === "perception"
                  ? `${band} · percepção`
                  : estimateLabel(summary),
            displayTheta: Math.max(bandIndex + 0.05, Math.min(bandIndex + 0.95, theta)),
            confidence:
              !measured || stale || (row?.sd ?? 1) > 0.6
                ? "low"
                : (row?.sd ?? 1) <= 0.35 && row?.source === "placement"
                  ? "high"
                  : "medium",
            explanation:
              method === "self_report" || method === "self_assessment"
                ? "Ponto de partida informado por você; ainda precisa de evidência de prática."
                : method === "perception"
                  ? "Percepção dos sons; a produção ainda precisa de gravações avaliadas."
                  : method === "ai_assessment"
                    ? "Inclui julgamento de escrita por IA, ainda não calibrado com avaliações humanas."
                    : method === "not_assessed"
                      ? "Ainda precisamos de tarefas variadas para confirmar esta habilidade."
                      : (stale ? "Esta estimativa precisa de confirmação recente. " : "") +
                        estimateExplanation(summary),
            evidenceCount: summary.evidenceCount,
            evidenceDays: summary.evidenceDays,
          },
        ];
      }),
    ) as Record<Skill, SkillState>;
    const theta =
      CORE_SKILLS.reduce((sum, skill) => sum + skills[skill].displayTheta, 0) / CORE_SKILLS.length;
    return { theta, level: readTheta(theta).level, skills };
  },
);

export function supportFor(
  level: CefrLevel,
  profile: Pick<LearnerProfile, "supportPreference">,
): SupportMode {
  return supportMode(level, profile.supportPreference);
}

export function today(profile: Pick<LearnerProfile, "timezone">, now = new Date()): string {
  return localDate(now, profile.timezone);
}
