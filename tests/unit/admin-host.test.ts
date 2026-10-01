import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@clerk/nextjs/server", () => ({ clerkMiddleware: () => vi.fn() }));
import proxy from "../../proxy";
afterEach(() => vi.unstubAllEnvs());
async function call(url: string) {
  vi.stubEnv("NEXT_PUBLIC_ADMIN_URL", "https://admin.taskwaveph.com");
  vi.stubEnv("CLERK_SECRET_KEY", "");
  return proxy(
    new NextRequest(url),
    {} as import("next/server").NextFetchEvent,
  );
}
describe("admin domain isolation", () => {
  it("prevents confirmation responses from being cached or indexed", async () => {
    for (const path of ["/apply/success", "/business-enquiry/success"]) {
      const response = await call(`https://taskwaveph.com${path}`);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    }
  });
  it("marks preview responses private and unindexable", async () => {
    for (const path of [
      "/dev-preview",
      "/dev-preview/businessLeads/sample-lead-002",
    ]) {
      const response = await call(`http://localhost:3000${path}`);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    }
  });
  it("blocks admin routes and downloads on the public production host", async () => {
    for (const path of [
      "/admin",
      "/admin/applications",
      "/api/admin/resumes/example",
    ])
      expect((await call(`https://taskwaveph.com${path}`)).status).toBe(404);
  });
  it("rewrites admin root and sections without caching or indexing", async () => {
    const response = await call("https://admin.taskwaveph.com/applications");
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://admin.taskwaveph.com/admin/applications",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
  it("does not expose public pages or a sitemap on the admin host", async () => {
    for (const path of ["/about", "/apply", "/sitemap.xml"])
      expect((await call(`https://admin.taskwaveph.com${path}`)).status).toBe(
        404,
      );
    const robots = await call("https://admin.taskwaveph.com/robots.txt");
    expect(await robots.text()).toContain("Disallow: /");
  });
  it("retains local admin development and rejects lookalike domains", async () => {
    expect((await call("http://localhost:3000/admin")).status).toBe(200);
    expect(
      (await call("https://admin.taskwaveph.com.evil.example/admin")).status,
    ).toBe(404);
  });
});
