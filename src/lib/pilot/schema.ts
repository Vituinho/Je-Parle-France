import { z } from "zod";

export const PILOT_CONSENT_VERSION = "pilot-2026-10-10-v1";
export const PILOT_NOTICE = [
  "Você está participando de uma versão de teste do Je Parle Français por cerca de 14 dias. Algumas funções podem mudar; suas estimativas não são certificação oficial.",
  "Usaremos dados educacionais: atividades, revisões, desempenho por habilidade, estimativas e tempo ativo aproximado. Abrir uma página não prova atenção ou aprendizagem.",
  "Se você escolher usar fala ou IA habilitadas, áudio e contexto educacional necessário podem ser processados por Azure Speech ou Anthropic. Registramos unidades de uso e falhas. No aplicativo, o áudio é processado temporariamente e descartado; não mantemos arquivo de gravação.",
  "Administradores autorizados podem selecionar suas avaliações de escrita e fala para comparar notas do sistema com revisão humana. Na escrita, o revisor pode ler a resposta selecionada. Na fala, a revisão humana exige ouvir a amostra com sua autorização; uma transcrição não permite avaliar pronúncia.",
  "Seu feedback e sua percepção de dificuldade são opcionais e separados das notas. Eles não mudam automaticamente seu domínio, nível ou plano. Não inclua dados pessoais ou segredos no comentário.",
  "Usamos essas informações para calibrar a aprendizagem. Feedback e registros de revisão humana são removidos após 90 dias da criação; resultados educacionais do produto seguem a política da conta. Você pode consultar e exportar seus dados na Conta.",
  "Participar é opcional. Você pode retirar o aceite nesta página: novas coletas específicas do piloto param e seu feedback e registros de revisão humana são apagados. Suas lições e seu progresso continuam disponíveis.",
] as const;

export const consentSchema = z.strictObject({
  version: z.literal(PILOT_CONSENT_VERSION),
  accepted: z.literal(true),
});
export const feedbackSchema = z.strictObject({
  context: z.enum(["session", "conversation", "speech", "weekly"]),
  sourceId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  difficulty: z.enum(["easy", "balanced", "hard"]),
  text: z.string().trim().max(500).optional(),
});
export const DIFFICULTY_LABELS = {
  easy: "Muito fácil",
  balanced: "Boa",
  hard: "Difícil demais",
} as const;
