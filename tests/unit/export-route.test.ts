import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({
    userId: "user_staff",
    getToken: async () => "fixture-token",
  }),
}));
vi.mock("../../features/applications/export", () => ({
  MAX_EXPORT_ROWS: 5000,
  createExport: vi.fn().mockResolvedValue(Buffer.from("fixture")),
}));
import { GET } from "../../app/api/admin/applications/export/route";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("bounded export requests", () => {
  it.each(["deadline", "disconnect"])(
    "aborts a stalled Convex query on %s",
    async (reason) => {
      vi.useFakeTimers();
      vi.stubEnv("CLERK_SECRET_KEY", "fixture");
      vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
      let signal: AbortSignal | undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: unknown, init: RequestInit) => {
          signal = init.signal ?? undefined;
          return new Promise((_resolve, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            );
          });
        }),
      );
      const caller = new AbortController();
      const pending = GET(
        new Request("http://localhost/api/admin/applications/export", {
          signal: caller.signal,
        }),
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(signal).toBeDefined();
      if (reason === "disconnect") caller.abort();
      else await vi.advanceTimersByTimeAsync(25000);
      expect(signal?.aborted).toBe(true);
      const response = await pending;
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
