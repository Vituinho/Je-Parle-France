import { afterEach, expect, it, vi } from "vitest";
import { register } from "./instrumentation";
const { validate } = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock("./lib/env", () => ({ serverEnv: validate }));
afterEach(() => {
  vi.unstubAllEnvs();
  validate.mockReset();
});
it("validates at Node startup and propagates configuration failures", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  validate.mockImplementation(() => {
    throw new Error("Invalid server environment");
  });
  await expect(register()).rejects.toThrow("Invalid server environment");
});
it("does not require secrets while building or in the edge proxy", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-build");
  await register();
  vi.stubEnv("NEXT_RUNTIME", "edge");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  await register();
  expect(validate).not.toHaveBeenCalled();
});
