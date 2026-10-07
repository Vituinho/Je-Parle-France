import { describe, expect, it } from "vitest";
import { information, posterior, probability, type ItemParams } from "./model";

const item = (difficulty: number, guess = 0): ItemParams => ({
  difficulty,
  discrimination: 1.7,
  guess,
  weight: 1,
});

describe("measurement model", () => {
  it("gives 50 % at θ = b without guessing and respects the guessing floor", () => {
    expect(probability(2.5, item(2.5))).toBeCloseTo(0.5);
    expect(probability(2.5, item(2.5, 0.25))).toBeCloseTo(0.625);
    expect(probability(-5, item(2.5, 0.25))).toBeGreaterThan(0.25);
  });

  it("returns the prior when there is no evidence", () => {
    const belief = posterior({ mean: 2, sd: 0.8 }, []);
    expect(belief.mean).toBeCloseTo(2, 1);
    expect(belief.sd).toBeCloseTo(0.8, 1);
  });

  it("moves up after successes on hard items and down after failures on easy ones", () => {
    const prior = { mean: 2, sd: 1 };
    const up = posterior(prior, [
      { item: item(3.5), score: 1 },
      { item: item(3.8), score: 1 },
    ]);
    const down = posterior(prior, [
      { item: item(1.2), score: 0 },
      { item: item(1.5), score: 0 },
    ]);
    expect(up.mean).toBeGreaterThan(2.5);
    expect(down.mean).toBeLessThan(1.5);
    expect(up.sd).toBeLessThan(1);
  });

  it("treats partial credit between success and failure", () => {
    const prior = { mean: 2, sd: 1 };
    const full = posterior(prior, [{ item: item(2.5), score: 1 }]).mean;
    const half = posterior(prior, [{ item: item(2.5), score: 0.5 }]).mean;
    const none = posterior(prior, [{ item: item(2.5), score: 0 }]).mean;
    expect(full).toBeGreaterThan(half);
    expect(half).toBeGreaterThan(none);
  });

  it("learns less from a lucky guess on multiple choice", () => {
    const prior = { mean: 2, sd: 1 };
    const typed = posterior(prior, [{ item: item(3.5), score: 1 }]).mean;
    const guessed = posterior(prior, [{ item: item(3.5, 0.5), score: 1 }]).mean;
    expect(typed).toBeGreaterThan(guessed);
  });

  it("is most informative near the item difficulty", () => {
    const near = information(2.5, item(2.5));
    const far = information(4.5, item(2.5));
    expect(near).toBeGreaterThan(far);
  });
});
