/** Coarse interaction windows, not mouse tracking or proof of attention. */
export const IDLE_MS = 60_000;
export const SLICE_MS = 30_000;

export class ActiveStudyClock {
  private tickAt: number;
  private interactionAt: number;
  private visible = true;
  private enabled = true;
  private total = 0;

  constructor(now: number) {
    this.tickAt = now;
    this.interactionAt = now;
  }
  sample(now: number) {
    const end = Math.max(this.tickAt, now);
    if (this.visible && this.enabled)
      this.total += Math.max(0, Math.min(end, this.interactionAt + IDLE_MS) - this.tickAt);
    this.tickAt = end;
    return Math.floor(this.total);
  }
  interact(now: number) {
    this.sample(now);
    this.interactionAt = now;
  }
  setVisible(now: number, visible: boolean) {
    this.sample(now);
    this.visible = visible;
    if (visible) this.interactionAt = now;
  }
  setEnabled(now: number, enabled: boolean) {
    this.sample(now);
    this.enabled = enabled;
    if (enabled) this.interactionAt = now;
  }
}
