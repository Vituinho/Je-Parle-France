"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * French speech synthesis in the browser — the zero-cost TTS fallback
 * (ADR-004). Picks the best installed French voice for the requested region.
 */
export type VoiceRegion = "fr-FR" | "fr-CA";
export type Rate = "slow" | "normal";

export interface SpeakOptions {
  region?: VoiceRegion;
  rate?: Rate;
  /** Use a different voice than the default for this region (second speaker). */
  alternate?: boolean;
}

export type VoiceStatus = "loading" | "ready" | "no-french-voice" | "unsupported";

const QUALITY = /(natural|neural|online|premium|enhanced|google)/i;

function rank(voice: SpeechSynthesisVoice, region: VoiceRegion): number {
  const lang = voice.lang.replace("_", "-").toLowerCase();
  let score = 0;
  if (lang === region.toLowerCase()) score += 10;
  else if (lang.startsWith("fr")) score += 4;
  if (QUALITY.test(voice.name)) score += 3;
  if (voice.localService) score += 1;
  return score;
}

export function frenchVoices(region: VoiceRegion): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("fr"))
    .sort((a, b) => rank(b, region) - rank(a, region));
}

// ─── Voice availability store (shared by every audio button) ──────────────

let status: VoiceStatus = "loading";
let initialised = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function refresh() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;
  status = voices.some((voice) => voice.lang.toLowerCase().startsWith("fr"))
    ? "ready"
    : "no-french-voice";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialised) {
    initialised = true;
    if (!("speechSynthesis" in window)) {
      status = "unsupported";
    } else {
      refresh();
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        refresh();
        emit();
      });
      // Some browsers never fire voiceschanged when no voice is installed.
      window.setTimeout(() => {
        if (status === "loading") {
          status = "no-french-voice";
          emit();
        }
      }, 2500);
    }
  }
  return () => listeners.delete(listener);
}

export function useVoiceStatus(): VoiceStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => "loading",
  );
}

export function useFrenchSpeech() {
  const voiceStatus = useVoiceStatus();
  const [speaking, setSpeaking] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakOne = useCallback((text: string, options: SpeakOptions = {}) => {
    return new Promise<void>((resolve) => {
      const region = options.region ?? "fr-FR";
      const voices = frenchVoices(region);
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = options.alternate ? (voices[1] ?? voices[0]) : voices[0];
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? region;
      utterance.rate = options.rate === "slow" ? 0.72 : 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /** Speaks one text or a sequence of lines (dialogues). */
  const speak = useCallback(
    async (lines: string | { text: string; options?: SpeakOptions }[], options?: SpeakOptions) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      cancelled.current = false;
      setSpeaking(true);
      const sequence = typeof lines === "string" ? [{ text: lines, options }] : lines;
      for (const line of sequence) {
        if (cancelled.current) break;
        await speakOne(line.text, line.options);
      }
      setSpeaking(false);
    },
    [speakOne],
  );

  const stop = useCallback(() => {
    cancelled.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { status: voiceStatus, speaking, speak, stop };
}
