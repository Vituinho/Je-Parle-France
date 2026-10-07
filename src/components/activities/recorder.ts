"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type RecorderState = "idle" | "recording" | "recorded" | "denied" | "unsupported";

/**
 * Microphone recording that stays in the browser. The blob is only uploaded
 * when a caller explicitly sends it to a speech provider; by default the
 * learner just listens back to themselves (privacy by design).
 */
const noop = () => () => {};
const recordingSupported = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices) &&
  typeof MediaRecorder !== "undefined";

export function useRecorder(maxMs = 15_000) {
  const supported = useSyncExternalStore(noop, recordingSupported, () => true);
  const [recorderState, setState] = useState<RecorderState>("idle");
  const state: RecorderState = supported ? recorderState : "unsupported";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const recorded = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        setBlob(recorded);
        setAudioUrl(URL.createObjectURL(recorded));
        setDurationMs(Date.now() - startedAt.current);
        setState("recorded");
      };
      recorder.current = media;
      startedAt.current = Date.now();
      media.start();
      setState("recording");
      timer.current = window.setTimeout(stop, maxMs);
    } catch {
      setState("denied");
    }
  }, [maxMs, stop]);

  const reset = useCallback(() => {
    setBlob(null);
    setAudioUrl(null);
    setDurationMs(0);
    setState("idle");
  }, []);

  return { state, start, stop, reset, audioUrl, blob, durationMs };
}
