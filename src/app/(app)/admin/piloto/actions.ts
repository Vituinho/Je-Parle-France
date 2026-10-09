"use server";
import { requireAdmin } from "@/server/session";
import { comparePilotCalibration } from "@/server/services/pilot";

export async function compareCalibrationAction(_previous: unknown, form: FormData) {
  const user = await requireAdmin();
  const file = form.get("records");
  if (!(file instanceof File) || file.size === 0 || file.size > 1_000_000)
    return { ok: false as const, error: "Selecione um arquivo JSON do kit, com até 1 MB." };
  try {
    const report = await comparePilotCalibration(user.id, JSON.parse(await file.text()));
    return { ok: true as const, report };
  } catch {
    return {
      ok: false as const,
      error: "Arquivo inválido ou acesso não autorizado. Confira o formato do kit de calibração.",
    };
  }
}
