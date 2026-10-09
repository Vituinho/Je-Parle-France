import { z } from "zod";
import { CEFR_LEVELS, type CefrLevel } from "./cefr";
import type { SupportPreference } from "./language-support";
import { DESTINATIONS, type DailyMinutes, type Destination } from "./onboarding";
import { dailyMinutesSchema, STUDY_PACES } from "./study-pace";
import { CORRECTION_MODES } from "./tutor/tutor";

/**
 * Learner preferences editable after onboarding (the "Conta" page). Labels
 * live here so onboarding and settings describe choices with the same words.
 */
export type TargetLevel = Exclude<CefrLevel, "A0">;

export const DESTINATION_OPTIONS: { value: Destination; label: string; description: string }[] = [
  {
    value: "canada_quebec",
    label: "Canadá / Québec",
    description: "Damos mais atenção ao francês do Canadá: sotaque, vocabulário, situações locais.",
  },
  {
    value: "france",
    label: "França",
    description: "Foco nas situações e no vocabulário do dia a dia na França.",
  },
  { value: "both", label: "Os dois", description: "Base internacional com notas dos dois lados." },
  {
    value: "undecided",
    label: "Ainda não sei",
    description: "Começamos pelo francês internacional — serve para qualquer destino.",
  },
];

export const SESSION_DESCRIPTIONS: Record<DailyMinutes, string> = {
  5: "Revisão do essencial, uma ideia nova e uma frase em voz alta.",
  15: "Revisão, uma microlição, um pouco de escuta e prática ativa.",
  30: "Sessão equilibrada: revisão, lição, escuta, pronúncia e fala.",
  45: "Mais espaço para escuta e produção, mantendo a revisão.",
  60: "Sessão completa, com leitura, escrita e conversa com o tutor.",
  90: "Blocos variados para escutar, falar, escrever e aplicar o que aprendeu.",
  120: "Estudo em blocos, com pausas e prática em situações reais.",
  180: "Imersão em blocos: pratique ao longo do dia, com tempo para descansar.",
};

export const TARGET_LEVEL_OPTIONS: { value: TargetLevel; description: string }[] = [
  { value: "A1", description: "Se apresentar e resolver o básico do dia a dia." },
  { value: "A2", description: "Conversas simples sobre rotina, compras e trabalho." },
  { value: "B1", description: "Se virar sozinho na maioria das situações do dia a dia." },
  { value: "B2", description: "Trabalhar e estudar em francês com desenvoltura." },
  { value: "C1", description: "Francês preciso e natural, inclusive em contextos profissionais." },
];

export const SUPPORT_PREFERENCES = [
  "more_portuguese",
  "auto",
  "more_french",
] as const satisfies readonly SupportPreference[];

export const SUPPORT_PREFERENCE_LABELS: Record<
  SupportPreference,
  { title: string; description: string }
> = {
  more_portuguese: {
    title: "Mais português",
    description: "Explicações em português por mais tempo, mesmo em níveis mais altos.",
  },
  auto: {
    title: "Automático",
    description: "O francês ganha espaço conforme o seu nível sobe. Recomendado.",
  },
  more_french: {
    title: "Mais francês",
    description: "Instruções em francês mais cedo. O português continua a um clique.",
  },
};

/** Time zones offered in settings: Brazil and the two destinations. */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "America/Sao_Paulo", label: "Brasília (São Paulo, Rio, BH…)" },
  { value: "America/Manaus", label: "Manaus" },
  { value: "America/Rio_Branco", label: "Rio Branco" },
  { value: "America/Noronha", label: "Fernando de Noronha" },
  { value: "America/Toronto", label: "Montréal, Québec, Toronto" },
  { value: "America/Halifax", label: "Halifax (Atlântico)" },
  { value: "America/Winnipeg", label: "Winnipeg" },
  { value: "America/Edmonton", label: "Calgary, Edmonton" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "Europe/Paris", label: "Paris (França)" },
  { value: "Europe/Lisbon", label: "Lisboa" },
];

export const WEEKLY_GOAL_DAYS = [3, 4, 5, 6, 7] as const;

export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const asNumber = (value: unknown) => (typeof value === "string" ? Number(value) : value);

export const preferencesSchema = z.object({
  name: z.string().trim().min(1, "Diga como quer ser chamado").max(60),
  dailyMinutes: z.preprocess(asNumber, dailyMinutesSchema),
  studyPace: z.enum(STUDY_PACES).optional(),
  weeklyGoalDays: z.preprocess(asNumber, z.literal(WEEKLY_GOAL_DAYS)),
  destination: z.enum(DESTINATIONS),
  targetLevel: z.preprocess(
    (value) => (value === "" || value === "unknown" ? null : value),
    z.enum(CEFR_LEVELS).exclude(["A0"]).nullable(),
  ),
  targetMonth: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Use o formato AAAA-MM")
      .optional(),
  ),
  correctionMode: z.enum(CORRECTION_MODES),
  supportPreference: z.enum(SUPPORT_PREFERENCES),
  timezone: z.string().max(64).refine(isTimeZone, { message: "Fuso horário inválido" }),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
