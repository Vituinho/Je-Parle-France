"use client";
import { useEffect, useRef } from "react";
import { ActiveStudyClock, SLICE_MS } from "@/lib/learning/telemetry/active-time";
import type { ActiveSlice } from "@/lib/learning/telemetry/events";

const flushers = new Set<() => Promise<void>>();
export async function sendSessionTransition(sessionId: string, transition: "start" | "pause") {
  if (transition === "pause") await Promise.all([...flushers].map((flush) => flush()));
  return fetch("/api/learning/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, transition }),
    keepalive: true,
  }).catch(() => undefined);
}

/** No key values, coordinates, responses or audio are inspected or sent. */
export function useActiveStudyTime(activityId: string, sessionId?: string) {
  const state = useRef<{
    clock: ActiveStudyClock;
    sent: number;
    sequence: number;
    streamId: string;
    queue: Promise<unknown>;
  } | null>(null);
  const read = () => state.current?.clock.sample(performance.now()) ?? 0;
  const flush = () => {
    const current = state.current;
    if (!current) return Promise.resolve();
    const total = current.clock.sample(performance.now());
    while (total - current.sent > 0) {
      const ms = Math.min(SLICE_MS, total - current.sent);
      current.sent += ms;
      const payload: ActiveSlice = {
        activityId,
        sessionId,
        streamId: current.streamId,
        sequence: ++current.sequence,
        activeMs: ms,
      };
      current.queue = current.queue.then(() =>
        fetch("/api/learning/time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
          signal: AbortSignal.timeout(1500),
        }).catch(() => undefined),
      );
    }
    return current.queue.then(() => undefined);
  };
  useEffect(() => {
    const clock = new ActiveStudyClock(performance.now());
    clock.setVisible(performance.now(), !document.hidden && document.hasFocus());
    const streamId = crypto.randomUUID();
    const initial: ActiveSlice = { activityId, sessionId, streamId, sequence: 0, activeMs: 0 };
    state.current = {
      clock,
      streamId,
      sequence: 0,
      sent: 0,
      queue: fetch("/api/learning/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial),
        keepalive: true,
        signal: AbortSignal.timeout(1500),
      }).catch(() => undefined),
    };
    const interact = () => clock.interact(performance.now());
    const visibility = () => {
      clock.setVisible(performance.now(), !document.hidden && document.hasFocus());
      if (document.hidden) void flush();
    };
    const hide = () => {
      clock.setVisible(performance.now(), false);
      void flush();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility);
    window.addEventListener("blur", hide);
    window.addEventListener("pagehide", hide);
    document.addEventListener("pointerdown", interact, { passive: true });
    document.addEventListener("keydown", interact, { passive: true });
    document.addEventListener("input", interact, { passive: true });
    const timer = setInterval(() => {
      void flush();
    }, SLICE_MS);
    flushers.add(flush);
    return () => {
      clock.setEnabled(performance.now(), false);
      void flush();
      clearInterval(timer);
      flushers.delete(flush);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pagehide", hide);
      document.removeEventListener("pointerdown", interact);
      document.removeEventListener("keydown", interact);
      document.removeEventListener("input", interact);
      state.current = null;
    };
    // The caller remounts this hook for each activity instance; listeners read no changing state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, sessionId]);
  return {
    read,
    flush,
    setEnabled: (enabled: boolean) => state.current?.clock.setEnabled(performance.now(), enabled),
  };
}
