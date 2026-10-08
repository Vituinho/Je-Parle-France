"use server";

import { z } from "zod";
import { recordShadowing } from "@/server/services/shadowing";
import { requireLearner } from "@/server/session";

const schema = z.object({ seconds: z.number().min(0).max(7200) });

export async function recordShadowingAction(input: unknown): Promise<{ ok: boolean }> {
  const { user, profile } = await requireLearner();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  await recordShadowing(user.id, profile, parsed.data.seconds);
  return { ok: true };
}
