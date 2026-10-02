import { afterEach, expect, it, vi } from "vitest";
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({
    userId: "staff",
    getToken: async () => "fixture-token",
  }),
}));
import { GET } from "../../app/api/admin/resumes/[id]/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function configure() {
  vi.stubEnv("CLERK_SECRET_KEY", "fixture");
  vi.stubEnv("CONVEX_SITE_URL", "https://fixture.convex.site");
}
it("preserves resume throttling headers without exposing upstream errors", async () => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("private upstream error", {
        status: 429,
        headers: { "Retry-After": "60" },
      }),
    ),
  );
  const response = await GET(
    new Request("http://localhost/api/admin/resumes/test"),
    { params: Promise.resolve({ id: "test" }) },
  );
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("60");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(await response.text()).not.toContain("private upstream");
});
it("cancels the upstream resume fetch when the browser disconnects", async () => {
  configure();
  let upstream: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: unknown, init: RequestInit) => {
      upstream = init.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        upstream?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    }),
  );
  const controller = new AbortController();
  const pending = GET(
    new Request("http://localhost/api/admin/resumes/test", {
      signal: controller.signal,
    }),
    { params: Promise.resolve({ id: "test" }) },
  );
  await vi.waitFor(() => expect(upstream).toBeDefined());
  controller.abort();
  expect(upstream?.aborted).toBe(true);
  expect((await pending).status).toBe(503);
});
