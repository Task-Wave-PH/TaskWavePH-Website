import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    query = query;
  },
}));
import { getPublishedJob } from "../../features/jobs/server";
import sitemap from "../../app/sitemap";
afterEach(() => {
  vi.unstubAllEnvs();
  query.mockReset();
});
describe("Public job service", () => {
  it("shows unavailable state when configuration is missing or queries fail", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
    expect(await getPublishedJob("role")).toEqual({
      state: "unavailable",
      job: null,
    });
    expect(query).not.toHaveBeenCalled();
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    query.mockRejectedValue(new Error("backend failed"));
    expect(await getPublishedJob("role")).toEqual({
      state: "unavailable",
      job: null,
    });
  });
  it("distinguishes missing roles from backend failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    query.mockResolvedValue(null);
    expect(await getPublishedJob("missing")).toEqual({
      state: "ready",
      job: null,
    });
    query.mockResolvedValue({ _id: "role", title: "Verified role" });
    expect((await getPublishedJob("role")).job).toMatchObject({
      title: "Verified role",
    });
  });
  it("includes published query results in sitemap and retains public routes on failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    query.mockResolvedValue({
      page: [{ _id: "published-role", updatedAt: 100 }],
      isDone: true,
      continueCursor: "",
    });
    const urls = (await sitemap()).map((r) => r.url);
    expect(urls).toContain("http://localhost:3000/careers/published-role");
    expect(urls.some((url) => url.includes("admin"))).toBe(false);
    query.mockRejectedValue(new Error("offline"));
    expect((await sitemap()).map((r) => r.url)).toContain(
      "http://localhost:3000/careers",
    );
  });
});
