import { levelIndex, readTheta, type CefrLevel } from "./cefr";
import type { Skill } from "./skills";

/**
 * Official French exams the course points to. Facts here are descriptive and
 * stable (sections, purpose, validity); anything that changes — fees, dates,
 * score conversions, immigration thresholds — is left to the official sites.
 * Our readiness estimate is internal and never equivalent to a result.
 */
export type ExamSectionId = "co" | "ce" | "eo" | "ee";

export interface ExamSection {
  id: ExamSectionId;
  title: string;
  skill: Extract<Skill, "listening" | "reading" | "speaking" | "writing">;
  /** Fixed duration, when the exam has one (DELF/DALF vary by level). */
  minutes?: number;
}

export interface ExamInfo {
  id: "tef-canada" | "tcf-canada" | "delf" | "dalf";
  name: string;
  organizer: string;
  destination: "canada" | "france";
  purpose: string;
  results: string;
  validity: string;
  url: string;
  sections: ExamSection[];
}

const SECTION_TITLES: Record<ExamSectionId, string> = {
  co: "Compreensão oral",
  ce: "Compreensão escrita",
  eo: "Expressão oral",
  ee: "Expressão escrita",
};

const section = (
  id: ExamSectionId,
  skill: ExamSection["skill"],
  minutes?: number,
): ExamSection => ({ id, title: SECTION_TITLES[id], skill, minutes });

export const EXAMS: readonly ExamInfo[] = [
  {
    id: "tef-canada",
    name: "TEF Canada",
    organizer: "Le français des affaires (CCI Paris Île-de-France)",
    destination: "canada",
    purpose: "Reconhecido pelo governo do Canadá (IRCC) para residência permanente e cidadania.",
    results:
      "Uma pontuação por prova, convertida em níveis NCLC pelas tabelas oficiais. Não há aprovação ou reprovação.",
    validity: "2 anos",
    url: "https://www.lefrancaisdesaffaires.fr/en/tests-diplomes/test-evaluation-francais-tef/tef-canada/",
    sections: [
      section("ce", "reading", 60),
      section("co", "listening", 40),
      section("ee", "writing", 60),
      section("eo", "speaking", 15),
    ],
  },
  {
    id: "tcf-canada",
    name: "TCF Canada",
    organizer: "France Éducation international",
    destination: "canada",
    purpose: "Reconhecido pelo governo do Canadá (IRCC) para residência permanente e cidadania.",
    results:
      "Pontuações convertidas em níveis do Quadro Europeu (CECR); para a imigração, as tabelas oficiais as convertem em NCLC.",
    validity: "2 anos",
    url: "https://tcfcandidat.france-education-international.fr/",
    sections: [
      section("co", "listening", 35),
      section("ce", "reading", 60),
      section("eo", "speaking", 12),
      section("ee", "writing", 60),
    ],
  },
  {
    id: "delf",
    name: "DELF tout public (A1 a B2)",
    organizer: "France Éducation international",
    destination: "france",
    purpose:
      "Diploma oficial do Ministério da Educação francês, um por nível. Útil para estudo, trabalho e alguns processos na França.",
    results: "Aprovação por nível, com nota mínima no total e em cada uma das quatro provas.",
    validity: "Vale para a vida toda",
    url: "https://france-education-international.fr/diplome/delf-tout-public",
    sections: [
      section("co", "listening"),
      section("ce", "reading"),
      section("ee", "writing"),
      section("eo", "speaking"),
    ],
  },
  {
    id: "dalf",
    name: "DALF (C1 e C2)",
    organizer: "France Éducation international",
    destination: "france",
    purpose: "Diploma oficial dos níveis avançados; aceito por muitas universidades francófonas.",
    results: "Aprovação por nível, como no DELF.",
    validity: "Vale para a vida toda",
    url: "https://www.france-education-international.fr/en/diplome/dalf",
    sections: [
      section("co", "listening"),
      section("ce", "reading"),
      section("ee", "writing"),
      section("eo", "speaking"),
    ],
  },
];

/** Official TEF → NCLC conversion table (the app never converts scores itself). */
export const TEF_NCLC_TABLE_URL =
  "https://www.lefrancaisdesaffaires.fr/wp-content/uploads/2024/10/correspondance-tef-nclc.pdf";

/** Standard normal cumulative distribution (Abramowitz & Stegun 7.1.26). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-((z * z) / 2));
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export type ReadinessBand = "unmeasured" | "self_assessed" | "far" | "close" | "likely";

export interface Readiness {
  band: ReadinessBand;
  /** Where the estimate sits today (only when measured). */
  estimate: CefrLevel | null;
  /** Probability that the skill is at or above the target level (internal). */
  probability: number | null;
}

/**
 * How likely a skill already sits at or above a level, given the estimate and
 * its uncertainty. Only measured skills get a probability: self-assessments
 * are shown as such, and self-reported or untested skills are "unmeasured".
 */
export function readiness(
  skill: { theta: number; sd: number; assessed: boolean; method: string },
  target: CefrLevel,
): Readiness {
  if (skill.method === "self_assessment") {
    // The learner's own judgement: shown as such, never as a probability.
    return { band: "self_assessed", estimate: readTheta(skill.theta).level, probability: null };
  }
  if (!skill.assessed || skill.method === "self_report" || skill.method === "not_assessed") {
    return { band: "unmeasured", estimate: null, probability: null };
  }
  const threshold = levelIndex(target);
  const probability = 1 - normalCdf((threshold - skill.theta) / Math.max(skill.sd, 0.05));
  const band: ReadinessBand = probability >= 0.6 ? "likely" : probability >= 0.2 ? "close" : "far";
  return { band, estimate: readTheta(skill.theta).level, probability };
}
