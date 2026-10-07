/**
 * CEFR scale used across placement, mastery and the curriculum.
 *
 * Abilities are expressed on a continuous scale where each level occupies one
 * unit band: A0 = [0, 1), A1 = [1, 2), A2 = [2, 3), B1 = [3, 4), B2 = [4, 5),
 * C1 = [5, 6). Values ≥ 6 are above the course ceiling (C2 territory) and are
 * displayed as "C1+". A0 is the product label for Pre-A1.
 */
export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const SCALE_MIN = 0;
export const SCALE_MAX = 6;

export function levelIndex(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

/** Centre of a level band, e.g. A2 → 2.5. */
export function levelMidpoint(level: CefrLevel): number {
  return levelIndex(level) + 0.5;
}

export function compareLevels(a: CefrLevel, b: CefrLevel): number {
  return levelIndex(a) - levelIndex(b);
}

export type BandPosition = "low" | "mid" | "high";

export interface LevelReading {
  level: CefrLevel;
  /** True when the ability is above the top band (C1+). */
  aboveCeiling: boolean;
  /** Position inside the band, 0 (just entered) … 1 (about to leave). */
  progress: number;
  position: BandPosition;
}

export function readTheta(theta: number): LevelReading {
  const clamped = Math.min(Math.max(theta, SCALE_MIN), SCALE_MAX);
  const aboveCeiling = theta >= SCALE_MAX;
  const index = Math.min(Math.floor(clamped), CEFR_LEVELS.length - 1);
  const level = CEFR_LEVELS[index] as CefrLevel;
  const progress = aboveCeiling ? 1 : clamped - index;
  const position: BandPosition = progress < 0.34 ? "low" : progress < 0.72 ? "mid" : "high";
  return { level, aboveCeiling, progress, position };
}

const nextLevel = (level: CefrLevel): CefrLevel | undefined => CEFR_LEVELS[levelIndex(level) + 1];

/**
 * Human label in Brazilian Portuguese, e.g. "A2 forte · entrando no B1".
 */
export function describeTheta(theta: number): string {
  const reading = readTheta(theta);
  if (reading.aboveCeiling) return "C1+";
  const { level, position } = reading;
  if (position === "low") return level === "A0" ? "A0 · iniciante" : `${level} inicial`;
  if (position === "mid") return level;
  const next = nextLevel(level);
  return next ? `${level} forte · entrando no ${next}` : `${level} forte`;
}

/** Compact label used in tight UI (badges): "A2", "A2+", "C1+". */
export function shortLevelLabel(theta: number): string {
  const reading = readTheta(theta);
  if (reading.aboveCeiling) return "C1+";
  return reading.position === "high" ? `${reading.level}+` : reading.level;
}

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && (CEFR_LEVELS as readonly string[]).includes(value);
}
