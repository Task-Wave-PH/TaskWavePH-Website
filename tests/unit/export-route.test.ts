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
    "aborts a stalled Convex request on %s",
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
  it("returns a private 429 before querying records or generating an export", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "fixture");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        status: "success",
        value: { allowed: false, retryAfterSeconds: 60 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request("http://localhost/api/admin/applications/export"),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await response.json()).toEqual({ error: "RATE_LIMITED" });
  });
});

describe("filtered campaign reporting", () => {
  it("returns only grouped campaign counts using validated filters", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "fixture");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          status: "success",
          value: { allowed: true, retryAfterSeconds: 0 },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          status: "success",
          value: {
            page: [
              {
                data: {
                  source: "linkedin",
                  campaign: "csr-2026",
                  email: "private@example.invalid",
                },
                status: "Shortlisted",
              },
            ],
            isDone: true,
            continueCursor: "",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request(
        "http://localhost/api/admin/applications/export?format=report&source=linkedin&campaign=csr-2026&from=2026-10-01",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const result = await response.json();
    expect(result.total).toBe(1);
    expect(result.groups[0]).toMatchObject({
      source: "linkedin",
      campaign: "csr-2026",
      received: 1,
      shortlisted: 1,
    });
    expect(JSON.stringify(result)).not.toContain("private@example.invalid");
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.args[0].filters).toEqual({
      source: "linkedin",
      campaign: "csr-2026",
      from: "2026-10-01",
    });
  });
  it("rejects invalid calendar filters before any external call", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "fixture");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request(
        "http://localhost/api/admin/applications/export?format=report&from=2026-02-30",
      ),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

it("never reports partial totals when the underlying page budget is exceeded", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "fixture");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        status: "success",
        value: { allowed: true, retryAfterSeconds: 0 },
      }),
    )
    .mockImplementation(async () =>
      Response.json({
        status: "success",
        value: { page: [], isDone: false, continueCursor: "next" },
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const response = await GET(
    new Request(
      "http://localhost/api/admin/applications/export?format=report&source=linkedin",
    ),
  );
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ error: "EXPORT_TOO_LARGE" });
  expect(fetchMock).toHaveBeenCalledTimes(101);
});

it.each(["report", "csv"])(
  "rejects a %s response that finishes after the deadline",
  async (format) => {
    vi.useFakeTimers();
    vi.stubEnv("CLERK_SECRET_KEY", "fixture");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
    const start = Date.now();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          status: "success",
          value: { allowed: true, retryAfterSeconds: 0 },
        }),
      )
      .mockImplementationOnce(async () => {
        if (format === "report") vi.setSystemTime(start + 25001);
        return Response.json({
          status: "success",
          value: { page: [], isDone: true, continueCursor: "" },
        });
      })
      .mockImplementationOnce(async () => {
        vi.setSystemTime(start + 25001);
        return Response.json({ status: "success", value: null });
      });
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request(
        `http://localhost/api/admin/applications/export?format=${format}`,
      ),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "EXPORT_UNAVAILABLE" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  },
);

it("keeps applicant searches out of URLs and forwards validated POST filters", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "fixture");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
  const { POST } =
    await import("../../app/api/admin/applications/export/route");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        status: "success",
        value: { allowed: true, retryAfterSeconds: 0 },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        status: "success",
        value: { page: [], isDone: true, continueCursor: "" },
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const url = "https://admin.taskwaveph.com/api/admin/applications/export";
  const response = await POST(
    new Request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.taskwaveph.com",
      },
      body: JSON.stringify({
        format: "report",
        search: "maria@example.invalid",
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).args[0].filters).toEqual({
    search: "maria@example.invalid",
  });
  expect(
    (await GET(new Request(`${url}?search=maria@example.invalid`))).status,
  ).toBe(400);
  expect(
    (
      await POST(
        new Request(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://another.invalid",
          },
          body: "{}",
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await POST(
        new Request(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: "a".repeat(3000) }),
        }),
      )
    ).status,
  ).toBe(400);
});

it("accepts the full validated filter envelope when codes contain multibyte characters", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "fixture");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.convex.cloud");
  const { POST } =
    await import("../../app/api/admin/applications/export/route");
  const payload = {
    format: "report",
    search: [...Array(7).fill("李".repeat(31)), "李".repeat(30)].join(" "),
    source: "源".repeat(200),
    campaign: "役".repeat(200),
    jobId: "a".repeat(100),
    from: "2026-01-01",
    to: "2026-12-31",
    status: "Shortlisted",
  };
  const body = JSON.stringify(payload);
  expect(new TextEncoder().encode(body).length).toBeGreaterThan(2048);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          status: "success",
          value: { allowed: true, retryAfterSeconds: 0 },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          status: "success",
          value: { page: [], isDone: true, continueCursor: "" },
        }),
      ),
  );
  const response = await POST(
    new Request("https://admin.taskwaveph.com/api/admin/applications/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );
  expect(response.status).toBe(200);
});
