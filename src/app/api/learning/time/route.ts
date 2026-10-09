import { getCurrentUser } from "@/server/session";
import { recordActiveSlice, StudyTimeError } from "@/server/services/study-time";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const text = await request.text();
  if (text.length > 1000) return Response.json({ ok: false }, { status: 413 });
  try {
    return Response.json(await recordActiveSlice(user.id, JSON.parse(text)));
  } catch (error) {
    if (
      error instanceof ZodError ||
      error instanceof StudyTimeError ||
      error instanceof SyntaxError
    )
      return Response.json({ ok: false }, { status: 400 });
    console.warn(JSON.stringify({ event: "telemetry_write_failed", operation: "active_time" }));
    return Response.json({ ok: false }, { status: 503 });
  }
}
