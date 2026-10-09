import { expect, it, vi } from "vitest";
import { GET } from "./route";
const { runtimeConnection } = vi.hoisted(() => ({ runtimeConnection: vi.fn() }));
vi.mock("next/server", () => ({ connection: runtimeConnection }));

it("checks the serving app without authentication, database, providers or sensitive metadata", async () => {
  const response = await GET();
  expect(runtimeConnection).toHaveBeenCalledOnce();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers.get("cache-control")).toBe("no-store");
});
