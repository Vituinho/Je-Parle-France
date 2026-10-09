import { describe, expect, it } from "vitest";
import { ActiveStudyClock } from "./active-time";

describe("active educational windows", () => {
  it("caps idle reading and never counts hidden, paused or provider-wait time", () => {
    const clock = new ActiveStudyClock(0);
    expect(clock.sample(120000)).toBe(60000);
    clock.interact(120000);
    clock.setVisible(125000, false);
    expect(clock.sample(300000)).toBe(65000);
    clock.setVisible(300000, true);
    clock.setEnabled(305000, false);
    expect(clock.sample(400000)).toBe(70000);
    clock.setEnabled(400000, true);
    expect(clock.sample(405000)).toBe(75000);
  });
  it("counts separate interaction windows and ignores a backwards clock", () => {
    const clock = new ActiveStudyClock(100);
    clock.interact(10100);
    expect(clock.sample(20100)).toBe(20000);
    expect(clock.sample(10000)).toBe(20000);
  });
});
