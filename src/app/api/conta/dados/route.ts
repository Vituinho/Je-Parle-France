import { exportUserData } from "@/server/services/account";
import { getCurrentUser } from "@/server/session";

/** LGPD access and portability: everything stored about the learner, as JSON. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const data = await exportUserData(user.id);
  const date = data.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="je-parle-francais-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
