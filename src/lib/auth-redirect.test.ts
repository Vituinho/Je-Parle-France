import { describe, expect, it } from "vitest";
import { safeNext } from "./auth-redirect";

describe("post-login redirect boundary", () => {
  it.each(["/hoje", "/licao/a0-u1-l1?mode=review", "/caderno#palavras"])(
    "preserves local paths: %s",
    (next) => {
      expect(safeNext(next, "/hoje")).toBe(next);
    },
  );
  it.each([
    null,
    undefined,
    "",
    "https://attacker.example.test",
    "//attacker.example.test",
    "/\\attacker.example.test",
    "/\n/attacker.example.test",
    "javascript:alert(1)",
    "hoje",
  ])("blocks an unsafe next value: %s", (next) => {
    const result = safeNext(next, "/hoje");
    expect(result).toBe("/hoje");
    expect(new URL(result, "https://app.example.test").origin).toBe("https://app.example.test");
  });
});
