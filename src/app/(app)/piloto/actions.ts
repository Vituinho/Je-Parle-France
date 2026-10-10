"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLearner } from "@/server/session";
import {
  acceptPilotConsent,
  withdrawPilotConsent,
  recordPilotFeedback,
  PilotParticipationError,
} from "@/server/services/pilot-participation";

export type PilotFormState = { ok: boolean; message: string };
export async function pilotLearnerAction(
  _previous: PilotFormState,
  form: FormData,
): Promise<PilotFormState> {
  const { user } = await requireLearner();
  try {
    const operation = z.enum(["consent", "withdraw", "feedback"]).parse(form.get("operation"));
    if (operation === "consent")
      await acceptPilotConsent(user.id, {
        version: form.get("version"),
        accepted: form.get("accepted") === "on",
      });
    if (operation === "withdraw") await withdrawPilotConsent(user.id);
    if (operation === "feedback")
      await recordPilotFeedback(user.id, {
        context: form.get("context"),
        sourceId: form.get("sourceId"),
        difficulty: form.get("difficulty"),
        text: form.get("text") ?? "",
      });
    // Feedback acknowledgements stay mounted; these reads are request-time, uncached.
    if (operation !== "feedback") {
      revalidatePath("/piloto");
      revalidatePath("/hoje");
      revalidatePath("/admin/piloto");
    }
    return {
      ok: true,
      message:
        operation === "withdraw"
          ? "Aceite retirado. Feedback e revisões do piloto foram apagados; seu progresso continua salvo."
          : operation === "consent"
            ? "Aceite registrado. Obrigado por participar!"
            : "Feedback registrado. Obrigado!",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof PilotParticipationError
          ? error.message
          : "Não foi possível salvar. Confira os campos e tente novamente.",
    };
  }
}
