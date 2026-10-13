// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
const actions = vi.hoisted(() => ({ state: vi.fn(), check: vi.fn() }));
vi.mock("@/app/(focus)/revisar/actions", () => ({
  checkReviewStateAction: actions.state,
  checkReviewAction: actions.check,
}));
vi.mock("./use-active-study-time", () => ({
  sendSessionTransition: vi.fn(),
  useActiveStudyTime: () => ({ read: () => 0, flush: async () => {}, setEnabled: () => {} }),
}));
vi.mock("@/components/activities/audio-button", () => ({ VoiceNotice: () => null }));
vi.mock("./practice-step", () => ({
  PracticeStep: ({
    activity,
    onCheck,
    onContinue,
  }: {
    activity: { id: string };
    onCheck: () => Promise<unknown>;
    onContinue: (result: null) => void;
  }) => (
    <div>
      <p>{activity.id}</p>
      <button onClick={() => void onCheck()}>Check fixture</button>
      <button onClick={() => onContinue(null)}>Next fixture</button>
    </div>
  ),
}));
import { ReviewPlayer } from "./review-player";
import type { PreparedReviewItem } from "@/server/services/review";
const items = ["one", "two", "three"].map((id) => ({
  key: id,
  conceptId: id,
  dimension: "recognition",
  activity: { id },
})) as PreparedReviewItem[];
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("review queue recovery", () => {
  it("skips consecutive stale questions automatically and shows the next valid one without checking answers", async () => {
    actions.state
      .mockResolvedValueOnce({ ok: true, stale: true })
      .mockResolvedValueOnce({ ok: true, stale: true })
      .mockResolvedValue({ ok: true, stale: false });
    const finish = vi.fn();
    render(
      <ReviewPlayer
        items={items}
        dueReview
        date="2026-10-13"
        support="pt"
        title="Review"
        exitHref="/hoje"
        onFinished={finish}
      />,
    );
    await screen.findByText("three");
    expect(screen.queryByText("one")).not.toBeInTheDocument();
    expect(screen.queryByText("two")).not.toBeInTheDocument();
    expect(actions.check).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
  });
  it("finishes an entirely stale queue once with no artificial answered/correct counts", async () => {
    actions.state.mockResolvedValue({ ok: true, stale: true });
    const finish = vi.fn();
    render(
      <ReviewPlayer
        items={items}
        dueReview
        date="2026-10-13"
        support="pt"
        title="Review"
        exitHref="/hoje"
        onFinished={finish}
      />,
    );
    await waitFor(() =>
      expect(finish).toHaveBeenCalledExactlyOnceWith({ answered: 0, correct: 0 }),
    );
    expect(actions.check).not.toHaveBeenCalled();
  });
  it("completes an empty resumed block instead of returning a blank question", async () => {
    const finish = vi.fn();
    render(
      <ReviewPlayer
        items={[]}
        dueReview
        date="2026-10-13"
        support="pt"
        title="Review"
        exitHref="/hoje"
        onFinished={finish}
      />,
    );
    await waitFor(() =>
      expect(finish).toHaveBeenCalledExactlyOnceWith({ answered: 0, correct: 0 }),
    );
  });
  it("offers a friendly retry and reload when automatic recovery fails", async () => {
    actions.state
      .mockRejectedValueOnce(new Error("PRIVATE DB"))
      .mockResolvedValue({ ok: true, stale: false });
    render(
      <ReviewPlayer
        items={[items[0]!]}
        dueReview
        date="2026-10-13"
        support="pt"
        title="Review"
        sessionId="session-id"
        exitHref="/hoje"
      />,
    );
    await screen.findByRole("alert");
    expect(screen.getByRole("link", { name: "Recarregar revisão" })).toHaveAttribute(
      "href",
      "/sessao?id=session-id",
    );
    expect(screen.queryByText(/PRIVATE DB/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar continuar" }));
    await screen.findByText("one");
  });
});
