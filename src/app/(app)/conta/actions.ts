"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { preferencesSchema } from "@/lib/learning/preferences";
import { deletePrivateData, updatePreferences } from "@/server/services/account";
import { requireLearner } from "@/server/session";

export type PreferencesResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function savePreferencesAction(input: unknown): Promise<PreferencesResult> {
  const { user } = await requireLearner();
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Confira os campos destacados.", fieldErrors };
  }
  await updatePreferences(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

const deletionSchema = z
  .object({ conversations: z.boolean(), corrections: z.boolean(), speech: z.boolean() })
  .refine((value) => value.conversations || value.corrections || value.speech, {
    message: "Escolha o que apagar.",
  });

export type DeletionResult =
  | { ok: true; deleted: { conversations: number; corrections: number; speechAttempts: number } }
  | { ok: false; error: string };

export async function deletePrivateDataAction(input: unknown): Promise<DeletionResult> {
  const { user } = await requireLearner();
  const parsed = deletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Escolha o que apagar." };
  const deleted = await deletePrivateData(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, deleted };
}
