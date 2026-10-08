"use client";

import { ErrorRecovery } from "@/components/error-recovery";
import "./globals.css";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <title>Vamos tentar de novo · Je Parle Français</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex min-h-full flex-col">
        <ErrorRecovery retry={retry} />
      </body>
    </html>
  );
}
