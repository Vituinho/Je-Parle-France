import { estimateTimeToLevel, monthsUntil, minutesPerDayForDeadline } from "./onboarding";
import { CEFR_LEVELS, type CefrLevel } from "./cefr";
import { addDays, weekStart } from "./time";
import type { Skill } from "./skills";

/** Weekly time is a flexible workload reference, never proficiency or a streak requirement. */
export function weeklyWorkload(
  days: readonly { localDate: string; studySeconds: number }[],
  date: string,
  dailyMinutes: number,
  weeklyGoalDays: number,
) {
  const monday = weekStart(date);
  const sunday = addDays(monday, 6);
  const seconds = days
    .filter((d) => d.localDate >= monday && d.localDate <= sunday && d.localDate <= date)
    .reduce((sum, d) => sum + Math.max(0, d.studySeconds), 0);
  const targetMinutes = dailyMinutes * weeklyGoalDays;
  return {
    completedMinutes: Math.floor(seconds / 60),
    targetMinutes,
    met: seconds >= targetMinutes * 60,
  };
}

export interface PaceSkill {
  theta: number;
  confidence: "high" | "medium" | "low";
  assessed: boolean;
  method: string;
  evidenceCount: number;
  evidenceDays: number;
}
export type PaceIndicator = {
  state: "no_deadline" | "insufficient" | "past" | "review" | "compatible" | "uncertain";
  message: string;
};

/** Workload comparison only. No individual ETA, no theta/minutes conversion or guaranteed date. */
export function deadlinePace(input: {
  skills: Record<Skill, PaceSkill>;
  dailyMinutes: number;
  weeklyGoalDays: number;
  targetLevel: string | null;
  targetMonth: string | null;
  date: string;
}): PaceIndicator {
  if (
    !input.targetLevel ||
    !input.targetMonth ||
    !CEFR_LEVELS.includes(input.targetLevel as CefrLevel) ||
    input.targetLevel === "A0"
  )
    return {
      state: "no_deadline",
      message: "Seu ritmo pode mudar com a rotina. Pausas e dias mais leves fazem parte do plano.",
    };
  const date = new Date(input.date + "T12:00:00Z");
  const months = monthsUntil(input.targetMonth, date);
  if (months <= 0)
    return {
      state: "past",
      message:
        "Seu prazo chegou ou passou. Você pode rever a data e continuar a partir do seu progresso.",
    };
  const measured = [
    input.skills.reading,
    input.skills.listening,
    input.skills.speaking,
    input.skills.writing,
  ];
  if (
    measured.some(
      (s) =>
        !s.assessed ||
        s.method !== "objective" ||
        s.confidence === "low" ||
        s.evidenceDays < 7 ||
        s.evidenceCount < 20,
    )
  )
    return {
      state: "insufficient",
      message:
        "Ainda faltam evidências variadas de escuta, fala, leitura e escrita para comparar seu ritmo ao prazo. Minutos de estudo, sozinhos, não confirmam avanço.",
    };
  const estimate = estimateTimeToLevel({
    currentTheta: Math.min(...measured.map((s) => s.theta)),
    targetLevel: input.targetLevel as Exclude<CefrLevel, "A0">,
    dailyMinutes: input.dailyMinutes,
    daysPerWeek: input.weeklyGoalDays,
  });
  const low = minutesPerDayForDeadline(estimate.hours[0], months, input.weeklyGoalDays) ?? Infinity;
  const high =
    minutesPerDayForDeadline(estimate.hours[1], months, input.weeklyGoalDays) ?? Infinity;
  if (input.dailyMinutes < low)
    return {
      state: "review",
      message:
        "A referência de carga de estudo sugere rever o prazo ou o tempo semanal. Aumente o ritmo apenas se couber na sua rotina; isso não garante o nível desejado.",
    };
  if (input.dailyMinutes >= high)
    return {
      state: "compatible",
      message:
        "Seu tempo disponível é compatível com a faixa de carga de estudo de referência. É uma comparação aproximada, não uma previsão de quando você chegará ao objetivo.",
    };
  return {
    state: "uncertain",
    message:
      "Seu tempo disponível está dentro de uma faixa de grande incerteza. Continue reunindo evidências de aprendizagem antes de rever o prazo.",
  };
}
