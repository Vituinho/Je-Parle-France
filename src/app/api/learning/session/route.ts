import { z } from "zod";
import { getCurrentUser } from "@/server/session";
import { recordSessionTransition, StudyTimeError } from "@/server/services/study-time";
const input = z.strictObject({
  sessionId: z.string().min(1).max(80),
  transition: z.enum(["start", "pause"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const text = await request.text();
  if (text.length > 300) return Response.json({ ok: false }, { status: 413 });
  try {
    const data = input.parse(JSON.parse(text));
    await recordSessionTransition(user.id, data.sessionId, data.transition);
    return Response.json({ ok: true });
  } catch (error) {
    if (
      error instanceof z.ZodError ||
      error instanceof StudyTimeError ||
      error instanceof SyntaxError
    )
      return Response.json({ ok: false }, { status: 400 });
    console.warn(JSON.stringify({ event: "telemetry_write_failed", operation: "session" }));
    return Response.json({ ok: false }, { status: 503 });
  }
}
