"use client";

import { ThemeProvider } from "next-themes";
import { CapabilitiesProvider, type ClientCapabilities } from "@/components/capabilities";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({
  children,
  capabilities,
}: {
  children: React.ReactNode;
  capabilities: ClientCapabilities;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <CapabilitiesProvider value={capabilities}>{children}</CapabilitiesProvider>
        <Toaster position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
