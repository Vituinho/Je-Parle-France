/**
 * Achievements mark meaningful milestones of learning — a first conversation,
 * words that became familiar, weeks that met the goal — never raw clicks or
 * time spent. They are derived from real data, so they can be recomputed at
 * any time and are never awarded twice.
 */
export interface AchievementMetrics {
  placementCompleted: number;
  lessonsCompleted: number;
  unitsCompleted: number;
  sessionsCompleted: number;
  trackLessons: number;
  /** Words recognised with at least "familiar" mastery. */
  wordsLearned: number;
  /** Words "strong" or better on every practised dimension. */
  wordsStrong: number;
  reviewsDone: number;
  conversations: number;
  streakDays: number;
  weeksInARow: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  metric: keyof AchievementMetrics;
  target: number;
  /** Unit shown in progress ("12 de 25 palavras"). */
  unit?: string;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "placement",
    title: "Ponto de partida",
    description: "Fazer o diagnóstico de nível.",
    metric: "placementCompleted",
    target: 1,
  },
  {
    id: "first-lesson",
    title: "Premier pas",
    description: "Concluir a primeira lição.",
    metric: "lessonsCompleted",
    target: 1,
  },
  {
    id: "first-session",
    title: "Sessão completa",
    description: "Concluir a sessão do dia pela primeira vez.",
    metric: "sessionsCompleted",
    target: 1,
  },
  {
    id: "first-unit",
    title: "Unidade concluída",
    description: "Concluir todas as lições de uma unidade.",
    metric: "unitsCompleted",
    target: 1,
  },
  {
    id: "track-first",
    title: "De malas prontas",
    description: "Concluir uma lição de Vivre au Canada ou Vivre en France.",
    metric: "trackLessons",
    target: 1,
  },
  {
    id: "first-conversation",
    title: "Primeira conversa",
    description: "Terminar uma conversa com o tutor e receber o relatório.",
    metric: "conversations",
    target: 1,
  },
  {
    id: "conversations-10",
    title: "Bon causeur",
    description: "Terminar 10 conversas com o tutor.",
    metric: "conversations",
    target: 10,
    unit: "conversas",
  },
  {
    id: "words-25",
    title: "25 palavras",
    description: "Reconhecer 25 palavras com segurança.",
    metric: "wordsLearned",
    target: 25,
    unit: "palavras",
  },
  {
    id: "words-100",
    title: "100 palavras",
    description: "Reconhecer 100 palavras com segurança.",
    metric: "wordsLearned",
    target: 100,
    unit: "palavras",
  },
  {
    id: "words-strong-50",
    title: "50 palavras firmes",
    description: "50 palavras firmes em tudo o que você praticou: ler, escrever, ouvir e falar.",
    metric: "wordsStrong",
    target: 50,
    unit: "palavras",
  },
  {
    id: "reviews-100",
    title: "100 revisões",
    description: "Fazer 100 revisões espaçadas.",
    metric: "reviewsDone",
    target: 100,
    unit: "revisões",
  },
  {
    id: "reviews-1000",
    title: "Mil revisões",
    description: "Fazer 1 000 revisões espaçadas.",
    metric: "reviewsDone",
    target: 1000,
    unit: "revisões",
  },
  {
    id: "streak-7",
    title: "Uma semana",
    description: "Estudar 7 dias seguidos (o descanso semanal não quebra a sequência).",
    metric: "streakDays",
    target: 7,
    unit: "dias",
  },
  {
    id: "streak-30",
    title: "Um mês",
    description: "Estudar 30 dias seguidos (com os descansos semanais).",
    metric: "streakDays",
    target: 30,
    unit: "dias",
  },
  {
    id: "weeks-4",
    title: "Quatro semanas de meta",
    description: "Cumprir a meta semanal quatro semanas seguidas.",
    metric: "weeksInARow",
    target: 4,
    unit: "semanas",
  },
];

export interface AchievementStatus extends AchievementDefinition {
  earned: boolean;
  earnedAt: string | null;
  /** Current value, capped at the target. */
  value: number;
}

/** Achievements whose target is reached but which are not recorded yet. */
export function newlyEarned(
  metrics: AchievementMetrics,
  earned: ReadonlySet<string>,
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(
    (achievement) =>
      !earned.has(achievement.id) && metrics[achievement.metric] >= achievement.target,
  );
}

/**
 * Every achievement with its status. Earned ones stay earned even if a metric
 * later drops (e.g. a streak ends) — milestones are not taken back.
 */
export function achievementStatus(
  metrics: AchievementMetrics,
  earned: ReadonlyMap<string, Date>,
): AchievementStatus[] {
  return ACHIEVEMENTS.map((achievement) => {
    const earnedAt = earned.get(achievement.id) ?? null;
    return {
      ...achievement,
      earned: earnedAt !== null,
      earnedAt: earnedAt?.toISOString() ?? null,
      value: Math.min(achievement.target, metrics[achievement.metric]),
    };
  });
}
