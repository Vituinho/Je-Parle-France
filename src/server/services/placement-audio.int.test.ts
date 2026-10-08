import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/placement/audio/route";
import * as capabilities from "@/lib/ai/capabilities";
import * as speech from "@/lib/ai/speech";
import { getContent } from "@/lib/content";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/session";
import { createTestUser, hasTestDatabase, resetDatabase } from "@/test/db";
import { completeOnboarding } from "./onboarding";
import { loadPlacement, startPlacement } from "./placement";

vi.mock("@/server/session", () => ({ getCurrentUser: vi.fn() }));

describe.skipIf(!hasTestDatabase)("private placement audio", () => {
  beforeEach(resetDatabase);
  afterEach(() => vi.restoreAllMocks());
  afterAll(() => db.$disconnect());

  async function currentItem() {
    vi.spyOn(capabilities, "getCapabilities").mockReturnValue({
      speechRecognition: true,
      pronunciationAssessment: true,
      serverTts: true,
      llm: false,
    });
    const user = await createTestUser();
    await completeOnboarding(user.id, {
      goals: ["personal"],
      destination: "undecided",
      priorExperience: "a_little",
      dailyMinutes: 15,
      targetLevel: "B1",
      start: "complete",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({ ...user, role: "learner" });
    const attemptId = await startPlacement(user.id, "skill", ["pronunciation"]);
    const view = await loadPlacement(user.id, attemptId);
    if (view.status !== "in_progress" || view.activity.type !== "minimal_pair")
      throw new Error("expected minimal pair");
    return {
      user,
      attemptId,
      view,
      request: new Request(`http://localhost:3000${view.activity.audioUrl}`),
    };
  }

  it("synthesizes only the server-selected word and returns audio without assessment metadata", async () => {
    const { user, request, view } = await currentItem();
    const synthesize = vi.fn(async () => ({ audio: new ArrayBuffer(8), contentType: "audio/wav" }));
    vi.spyOn(speech, "getSpeech").mockReturnValue({
      tts: { id: "test", synthesize },
      stt: { id: "test", transcribe: vi.fn() },
      pronunciation: { id: "test", assess: vi.fn(), features: vi.fn() },
    });
    const result = await GET(request);
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Type")).toBe("audio/wav");
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect((await result.arrayBuffer()).byteLength).toBe(8);
    const activity = getContent().placementItems.get(view.itemId)!.activity;
    if (activity.type !== "minimal_pair") throw new Error("expected minimal pair");
    expect(synthesize).toHaveBeenCalledWith(
      expect.objectContaining({ text: activity.pair[activity.answer].word }),
    );
    expect(await db.usageCounter.findFirst({ where: { userId: user.id } })).toMatchObject({
      count: 1,
    });
  });

  it("rejects unauthenticated access, other learners and noncurrent items before synthesis", async () => {
    const { request, attemptId, user } = await currentItem();
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await GET(request)).status).toBe(401);
    const other = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ ...other, role: "learner" });
    expect((await GET(request)).status).toBe(404);
    vi.mocked(getCurrentUser).mockResolvedValue({ ...user, role: "learner" });
    expect(
      (
        await GET(
          new Request(
            `http://localhost:3000/api/placement/audio?attemptId=${attemptId}&itemId=pp-a0-01`,
          ),
        )
      ).status,
    ).toBe(404);
    expect(await db.usageCounter.count()).toBe(0);
  });

  it("returns an honest unavailable response when the provider is missing", async () => {
    const { request } = await currentItem();
    vi.spyOn(speech, "getSpeech").mockReturnValue(null);
    expect((await GET(request)).status).toBe(501);
    expect(await db.usageCounter.count()).toBe(0);
  });
});
