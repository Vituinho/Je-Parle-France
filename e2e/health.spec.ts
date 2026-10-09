import { expect, test } from "@playwright/test";

test("public healthcheck and production assets are available without a session", async ({
  request,
}) => {
  const health = await request.get("/api/health", { headers: { Host: "healthcheck.railway.app" } });
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });
  expect(health.headers()["cache-control"]).toBe("no-store");
  expect((await request.post("/api/health")).status()).toBe(405);
  const redirect = await request.get("/hoje", {
    headers: {
      Host: "staging.example.test",
      "x-forwarded-host": "staging.example.test",
      "x-forwarded-proto": "https",
    },
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()["location"]).toMatch(/^\/entrar\?next=/);
  const signup = await request.get("/cadastro");
  expect(signup.status()).toBe(200);
  const css = (await signup.text()).match(/href="([^"\s]+\.css(?:\?[^"\s]*)?)"/);
  expect(css?.[1]).toBeTruthy();
  const asset = await request.get(css![1]!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("text/css");
});
