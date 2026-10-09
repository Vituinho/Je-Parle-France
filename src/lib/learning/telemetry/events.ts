import { z } from "zod";
import { DIMENSIONS, SKILLS } from "../skills";

const id = z
  .string()
  .min(1)
  .max(180)
  .regex(/^[a-zA-Z0-9:._#-]+$/);
const block = z.number().int().min(0).max(500);
const state = z.enum([
  "unseen",
  "introduced",
  "learning",
  "familiar",
  "strong",
  "mastered",
  "decaying",
]);
const event = <T extends string, S extends z.ZodType>(type: T, payload: S) =>
  z.strictObject({ type: z.literal(type), payload });
const lifecycle = z.strictObject({ blockIndex: block });
export const learningEventSchema = z.discriminatedUnion("type", [
  event("session_started", lifecycle),
  event("session_paused", lifecycle),
  event("session_resumed", lifecycle),
  event("block_started", lifecycle),
  event(
    "skill_estimate_changed",
    z.strictObject({
      skill: z.enum(SKILLS),
      before: z.enum(["A0", "A1", "A2", "B1", "B2", "C1", "C2"]),
      after: z.enum(["A0", "A1", "A2", "B1", "B2", "C1", "C2"]),
      thetaBefore: z.number().min(0).max(6),
      thetaAfter: z.number().min(0).max(6),
      reason: z.enum(["calibration", "collecting", "strengthening", "promoted", "demoted"]),
      evidenceCount: z.number().int().nonnegative(),
      evidenceDays: z.number().int().nonnegative(),
      method: z.enum([
        "objective",
        "ai_assessment",
        "perception",
        "self_assessment",
        "self_report",
        "not_assessed",
      ]),
    }),
  ),
  event(
    "block_completed",
    z.strictObject({ blockIndex: block, expectedSeconds: z.number().int().nonnegative() }),
  ),
  event(
    "activity_started",
    z.strictObject({ activityId: id, streamId: z.uuid(), blockIndex: block.optional() }),
  ),
  event(
    "active_time",
    z.strictObject({
      streamId: z.uuid(),
      sequence: z.number().int().min(1).max(10000),
      activeMs: z.number().int().min(0).max(30000),
      activityId: id,
    }),
  ),
  event(
    "activity_completed",
    z.strictObject({
      attemptId: id,
      masteryChanges: z
        .array(
          z.strictObject({
            conceptId: id,
            dimension: z.enum(DIMENSIONS),
            before: state,
            after: state,
          }),
        )
        .max(40),
    }),
  ),
  event(
    "provider_usage",
    z.strictObject({
      provider: z.enum(["anthropic", "azure", "mock"]),
      operation: z.enum([
        "tutor_turn",
        "tutor_report",
        "writing_feedback",
        "pronunciation",
        "stt",
        "tts",
      ]),
      simulated: z.boolean(),
      status: z.enum(["ok", "failed"]),
      reason: z
        .enum([
          "timeout",
          "rate_limited",
          "invalid_output",
          "unavailable",
          "unsupported",
          "refusal",
          "unknown",
        ])
        .nullable(),
      elapsedMs: z.number().int().min(0).max(600000),
      inputTokens: z.number().int().nonnegative().nullable(),
      outputTokens: z.number().int().nonnegative().nullable(),
      audioMs: z.number().int().min(0).max(60000).nullable(),
    }),
  ),
]);
export type LearningEvent = z.infer<typeof learningEventSchema>;
export const telemetrySkillSchema = z.enum(SKILLS);

export const activeSliceSchema = z.strictObject({
  sessionId: id.optional(),
  blockIndex: block.optional(),
  activityId: id,
  streamId: z.uuid(),
  sequence: z.number().int().min(0).max(10000),
  activeMs: z.number().int().min(0).max(30000),
});
export type ActiveSlice = z.infer<typeof activeSliceSchema>;
