import { SKILLS, SKILL_LABELS } from "@/lib/learning/skills";
import type { LearnerLevel } from "@/server/services/learner";

const CONFIDENCE = { high: "confiança alta", medium: "confiança média", low: "confiança baixa" };
export function SkillEstimates({ skills }: { skills: LearnerLevel["skills"] }) {
  return (
    <section aria-labelledby="skill-estimates" className="mt-8">
      <h2 id="skill-estimates" className="text-xl font-semibold">
        Estimativas por habilidade
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        As faixas mudam com evidência consistente em tarefas variadas. Concluir lições não certifica
        um nível CEFR.
      </p>
      <ul className="divide-border mt-4 divide-y">
        {SKILLS.map((skill) => (
          <li key={skill} data-skill={skill} className="py-3">
            <p>
              <span className="font-medium">{SKILL_LABELS[skill].pt}</span>
              <span className="ml-3 font-semibold">{skills[skill].label}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                · {CONFIDENCE[skills[skill].confidence]}
              </span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{skills[skill].explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
