import { SCALE_MAX, SCALE_MIN } from "../cefr";

/**
 * Measurement model for placement (ADR-003).
 *
 * P(correct | θ) = c + (1 − c) · σ(a · (θ − b))
 *
 * - θ: ability on the CEFR scale (A1 = 1…2, A2 = 2…3, …)
 * - b: item difficulty on the same scale
 * - a: discrimination (fixed per item family, not calibrated yet)
 * - c: guessing floor (1/options for multiple choice)
 *
 * Partial-credit scores s ∈ [0, 1] use the pseudo-likelihood P^s (1 − P)^(1 − s),
 * and each item can be down-weighted (self-assessment) by raising its
 * likelihood to a power w ≤ 1. Posteriors are computed on a dense grid, which
 * is exact enough for one dimension and trivially testable.
 */
export interface ItemParams {
  difficulty: number;
  discrimination: number;
  guess: number;
  weight: number;
}

export interface Observation {
  item: ItemParams;
  /** 0…1 */
  score: number;
}

export interface NormalBelief {
  mean: number;
  sd: number;
}

const GRID_MIN = SCALE_MIN - 0.75;
const GRID_MAX = SCALE_MAX + 0.75;
const GRID_STEP = 0.05;

export const GRID: readonly number[] = Array.from(
  { length: Math.round((GRID_MAX - GRID_MIN) / GRID_STEP) + 1 },
  (_, i) => GRID_MIN + i * GRID_STEP,
);

export const DEFAULT_DISCRIMINATION = 1.7;

export function probability(theta: number, item: ItemParams): number {
  const logistic = 1 / (1 + Math.exp(-item.discrimination * (theta - item.difficulty)));
  return item.guess + (1 - item.guess) * logistic;
}

const EPSILON = 1e-9;

export function logLikelihood(theta: number, observation: Observation): number {
  const p = Math.min(Math.max(probability(theta, observation.item), EPSILON), 1 - EPSILON);
  const s = Math.min(Math.max(observation.score, 0), 1);
  return observation.item.weight * (s * Math.log(p) + (1 - s) * Math.log(1 - p));
}

/** Log-likelihood of one observation at every grid point. */
export function logLikelihoodVector(observation: Observation): Float64Array {
  const vector = new Float64Array(GRID.length);
  GRID.forEach((theta, i) => (vector[i] = logLikelihood(theta, observation)));
  return vector;
}

export function sumVectors(vectors: readonly Float64Array[]): Float64Array {
  const total = new Float64Array(GRID.length);
  for (const vector of vectors) for (let i = 0; i < total.length; i += 1) total[i]! += vector[i]!;
  return total;
}

/** Posterior mean/SD of θ given a normal prior and observations. */
export function posterior(prior: NormalBelief, observations: readonly Observation[]): NormalBelief {
  return posteriorFromLogLikelihood(prior, sumVectors(observations.map(logLikelihoodVector)));
}

/** Posterior from a prior and a pre-summed log-likelihood vector over GRID. */
export function posteriorFromLogLikelihood(
  prior: NormalBelief,
  logLik: Float64Array,
): NormalBelief {
  const logPosterior = GRID.map((theta, i) => {
    const z = (theta - prior.mean) / prior.sd;
    return -0.5 * z * z + (logLik[i] as number);
  });
  const max = Math.max(...logPosterior);
  const weights = logPosterior.map((value) => Math.exp(value - max));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let mean = 0;
  GRID.forEach((theta, i) => (mean += (theta * (weights[i] as number)) / total));
  let variance = 0;
  GRID.forEach((theta, i) => (variance += ((theta - mean) ** 2 * (weights[i] as number)) / total));
  return { mean, sd: Math.sqrt(variance) };
}

/** Fisher information of an item at θ (used to prefer informative items). */
export function information(theta: number, item: ItemParams): number {
  const p = Math.min(Math.max(probability(theta, item), EPSILON), 1 - EPSILON);
  const q = 1 - p;
  // 3PL information: a² · (Q/P) · ((P − c)/(1 − c))²
  return (
    item.discrimination ** 2 * (q / p) * ((p - item.guess) / (1 - item.guess)) ** 2 * item.weight
  );
}
