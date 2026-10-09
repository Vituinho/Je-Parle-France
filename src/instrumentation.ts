/** Validate configuration before serving traffic, without requiring build secrets. */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { serverEnv } = await import("./lib/env");
    serverEnv();
  }
}
