import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@clerk/nextjs/server", () => ({ clerkMiddleware: () => vi.fn() }));
import proxy, { config } from "../../proxy";
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
  it("matches Clerk auto-proxy once after the API matcher", () => {
    expect(
      config.matcher.filter((value) => value === "/__clerk/:path*"),
    ).toHaveLength(1);
    expect(config.matcher.indexOf("/__clerk/:path*")).toBeGreaterThan(
      config.matcher.indexOf("/(api|trpc)(.*)"),
    );
  });
  it("rewrites staff signup and blocks it on public hosts", async () => {
    const response = await call("https://admin.taskwaveph.com/sign-up");
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://admin.taskwaveph.com/admin/sign-up",
    );
    expect(
      (await call("https://www.taskwaveph.com/admin/sign-up")).status,
    ).toBe(404);
  });
  it("rejects Clerk auto-proxy when authentication is unconfigured", async () => {
    const response = await call("https://admin.taskwaveph.com/__clerk/test");
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
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
    const page = await call("https://taskwaveph.com/admin");
    expect(page.headers.get("x-middleware-rewrite")).toBe(
      "https://taskwaveph.com/unavailable",
    );
    expect(page.headers.get("cache-control")).toBe("private, no-store");
    const api = await call("https://taskwaveph.com/api/admin/resumes/example");
    expect(api.headers.get("x-middleware-rewrite")).toBeNull();
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
    vi.stubEnv("NODE_ENV", "development");
    expect((await call("http://localhost:3000/admin")).status).toBe(200);
    expect(
      (await call("https://admin.taskwaveph.com.evil.example/admin")).status,
    ).toBe(404);
  });
  it("blocks localhost and preview administration in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const host of [
      "localhost:3000",
      "taskwaveph.vercel.app",
      "www.taskwaveph.com",
    ]) {
      for (const path of [
        "/admin",
        "/admin/users",
        "/api/admin/applications/export",
        "/__clerk/test",
      ]) {
        expect((await call(`http://${host}${path}`)).status).toBe(404);
      }
    }
    const users = await call("https://admin.taskwaveph.com/users");
    expect(users.headers.get("x-middleware-rewrite")).toBe(
      "https://admin.taskwaveph.com/admin/users",
    );
  });
});

it("isolates the Owner activity route on the admin hostname", async () => {
  expect((await call("https://www.taskwaveph.com/admin/activity")).status).toBe(
    404,
  );
  const response = await call("https://admin.taskwaveph.com/activity");
  expect(response.headers.get("x-middleware-rewrite")).toBe(
    "https://admin.taskwaveph.com/admin/activity",
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
