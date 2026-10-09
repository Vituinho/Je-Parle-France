// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useActiveStudyTime, withStudyWait } from "./use-active-study-time";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("excludes actual provider-wait and hidden-tab intervals, flushing only coarse timing metadata", async () => {
  vi.useFakeTimers();
  const epoch = Date.now();
  vi.spyOn(performance, "now").mockImplementation(
    () => Date.now() - epoch + (Date.now() === epoch ? 0 : 0.75),
  );
  const fetchMock = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  let hidden = false;
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  let timing: ReturnType<typeof useActiveStudyTime> | undefined;
  function Harness() {
    timing = useActiveStudyTime("authored-task");
    return <input aria-label="Private answer" />;
  }
  render(<Harness />);
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(timing!.read()).toBe(5000);
  let release!: () => void;
  let operation!: Promise<void>;
  await act(async () => {
    operation = withStudyWait(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    vi.advanceTimersByTime(20000);
  });
  expect(timing!.read()).toBe(5000);
  await act(async () => {
    release();
    await operation;
    vi.advanceTimersByTime(3000);
  });
  expect(timing!.read()).toBe(8000);
  await act(async () => {
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(20000);
  });
  expect(timing!.read()).toBe(8000);
  await act(async () => {
    await timing!.flush();
  });
  const bodies = fetchMock.mock.calls.map((call) =>
    JSON.parse((call as unknown as [string, RequestInit])[1].body as string),
  );
  expect(bodies.filter((b) => b.sequence > 0).reduce((sum, b) => sum + b.activeMs, 0)).toBe(8000);
  expect(
    bodies.every((b) =>
      Object.keys(b).every((k) =>
        ["activityId", "sessionId", "streamId", "sequence", "activeMs"].includes(k),
      ),
    ),
  ).toBe(true);
});
