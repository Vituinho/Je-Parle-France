/** Only local paths may reach the client router; URL parsers normalize backslashes. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next?.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) {
    return fallback;
  }
  const base = "https://same-origin.invalid";
  try {
    return new URL(next, base).origin === base ? next : fallback;
  } catch {
    return fallback;
  }
}
