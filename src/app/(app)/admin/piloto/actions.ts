"use server";
import { requireAdmin } from "@/server/session";
import { comparePilotCalibration } from "@/server/services/pilot";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { PilotFormState } from "@/app/(app)/piloto/actions";
import {
  invitePilotParticipant,
  finishPilotParticipant,
  PilotParticipationError,
} from "@/server/services/pilot-participation";
import {
  addPilotCalibrationSample,
  savePilotHumanReview,
} from "@/server/services/pilot-assessments";
import { WRITING_CRITERIA } from "@/lib/learning/writing/assessment";

export async function pilotAdminAction(
  _previous: PilotFormState,
  form: FormData,
): Promise<PilotFormState> {
  const admin = await requireAdmin();
  try {
    const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
      userId = id.parse(form.get("userId"));
    const operation = z.enum(["invite", "finish", "add", "review"]).parse(form.get("operation"));
    if (operation === "invite") await invitePilotParticipant(admin.id, userId);
    if (operation === "finish") await finishPilotParticipant(admin.id, userId);
    if (operation === "add") {
      const [kind, sourceId] = z.string().max(140).parse(form.get("source")).split(":");
      await addPilotCalibrationSample(admin.id, userId, { kind, id: sourceId });
    }
    if (operation === "review") {
      const kind = z.enum(["speech", "writing"]).parse(form.get("kind"));
      const readBand = (key: string) =>
        Number(
          z
            .string()
            .regex(/^[0-4]$/)
            .parse(form.get(key)),
        );
      const notes = z
        .string()
        .max(500)
        .parse(form.get("notes") ?? "");
      const human =
        kind === "writing"
          ? {
              kind,
              notes,
              scores: Object.fromEntries(WRITING_CRITERIA.map((c) => [c, readBand(c)])),
            }
          : {
              kind,
              notes,
              pronunciationBand: readBand("pronunciationBand"),
              intelligibilityBand: readBand("intelligibilityBand"),
              heardConsentedSample: form.get("heardConsentedSample") === "on",
              agreesWithSystem:
                z.enum(["true", "false"]).parse(form.get("agreesWithSystem")) === "true",
            };
      await savePilotHumanReview(admin.id, userId, id.parse(form.get("sampleId")), human);
    }
    revalidatePath("/admin/piloto");
    revalidatePath("/piloto");
    revalidatePath("/hoje");
    return {
      ok: true,
      message:
        operation === "invite"
          ? "Convite registrado."
          : operation === "finish"
            ? "Coleta encerrada para este participante."
            : operation === "add"
              ? "Amostra selecionada. Abra a revisão abaixo."
              : "Revisão humana salva. Nenhum critério de pontuação foi alterado.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof PilotParticipationError
          ? error.message
          : "Não foi possível salvar. Confira os campos e sua autorização.",
    };
  }
}

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
