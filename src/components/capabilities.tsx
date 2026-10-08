"use client";

import { createContext, useContext } from "react";

export interface ClientCapabilities {
  /** Neural TTS through /api/tts (otherwise the browser's own voices). */
  serverTts: boolean;
  /** Pronunciation assessment through /api/speech/assess. */
  pronunciation: boolean;
}

const CapabilitiesContext = createContext<ClientCapabilities>({
  serverTts: false,
  pronunciation: false,
});

export function CapabilitiesProvider({
  value,
  children,
}: {
  value: ClientCapabilities;
  children: React.ReactNode;
}) {
  return <CapabilitiesContext value={value}>{children}</CapabilitiesContext>;
}

export function useCapabilities(): ClientCapabilities {
  return useContext(CapabilitiesContext);
}
