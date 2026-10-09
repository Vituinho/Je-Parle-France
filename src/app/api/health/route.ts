import { connection } from "next/server";

/** Application liveness only. Database readiness is checked during release/smoke tests. */
export async function GET() {
  // With Cache Components, this must execute in the serving process, not prerender.
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
