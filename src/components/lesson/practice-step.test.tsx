// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
vi.mock("./use-active-study-time", () => ({
  useActiveStudyTime: () => ({ read: () => 0, flush: async () => {}, setEnabled: () => {} }),
}));
vi.mock("@/components/activities/activity-renderer", () => ({
  ActivityRenderer: ({
    onDraft,
  }: {
    onDraft: (draft: { kind: "choice"; choice: number }) => void;
  }) => (
    <button type="button" onClick={() => onDraft({ kind: "choice", choice: 0 })}>
      Answer fixture
    </button>
  ),
}));
import { PracticeStep } from "./practice-step";
import type { ClientActivity } from "@/lib/learning/activities/client";
const activity = {
  id: "test",
  type: "choice",
  options: ["Bonjour"],
  instruction: { pt: "Escolha" },
} as ClientActivity;
afterEach(cleanup);
it("automatically advances a stale submission response without showing scheduling errors or scoring it", async () => {
  const advance = vi.fn(),
    check = vi.fn().mockResolvedValue({ ok: true, skipped: true });
  render(
    <PracticeStep
      instanceKey="one"
      activity={activity}
      support="pt"
      onCheck={check}
      onContinue={advance}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Answer fixture" }));
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(advance).toHaveBeenCalledExactlyOnceWith(null));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("keeps failed requests recoverable without exposing internal errors", async () => {
  const advance = vi.fn(),
    check = vi.fn().mockRejectedValue(new Error("PRIVATE scheduling state"));
  render(
    <PracticeStep
      instanceKey="one"
      activity={activity}
      support="pt"
      onCheck={check}
      onContinue={advance}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Answer fixture" }));
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert")).toHaveTextContent("Tente novamente ou recarregue");
  expect(screen.queryByText(/PRIVATE/)).not.toBeInTheDocument();
  expect(advance).not.toHaveBeenCalled();
});
