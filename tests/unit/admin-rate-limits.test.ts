/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { afterEach, expect, it, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
afterEach(() => vi.useRealTimers());
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
async function staff(t: ReturnType<typeof setup>, subject: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("adminUsers", { subject, active: true });
  });
  return t.withIdentity({ subject, issuer: "https://clerk.test" });
}
it("persists export denials, isolates staff budgets, and recovers after the window", async () => {
  vi.useFakeTimers();
  const t = setup();
  const first = await staff(t, "first");
  const second = await staff(t, "second");
  for (let i = 0; i < 5; i++)
    expect((await first.mutation(api.exports.begin, {})).allowed).toBe(true);
  for (let i = 0; i < 2; i++) {
    const denied = await first.mutation(api.exports.begin, {});
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  }
  expect((await second.mutation(api.exports.begin, {})).allowed).toBe(true);
  vi.advanceTimersByTime(600001);
  expect((await first.mutation(api.exports.begin, {})).allowed).toBe(true);
});
it("bounds combined exports across staff", async () => {
  const t = setup();
  for (let user = 0; user < 4; user++) {
    const approved = await staff(t, `staff${user}`);
    for (let i = 0; i < 5; i++)
      expect((await approved.mutation(api.exports.begin, {})).allowed).toBe(
        true,
      );
  }
  const next = await staff(t, "next");
  expect((await next.mutation(api.exports.begin, {})).allowed).toBe(false);
  expect((await next.mutation(api.exports.begin, {})).allowed).toBe(false);
});
it("requires active staff approval before permitting exports or resumes", async () => {
  const t = setup();
  await expect(t.mutation(api.exports.begin, {})).rejects.toThrow(
    "UNAUTHORIZED",
  );
  const unapproved = t.withIdentity({
    subject: "visitor",
    issuer: "https://clerk.test",
  });
  await expect(unapproved.mutation(api.exports.begin, {})).rejects.toThrow(
    "FORBIDDEN",
  );
  await expect(
    unapproved.mutation(internal.downloads.permit, {}),
  ).rejects.toThrow("FORBIDDEN");
  const approved = await staff(t, "staff");
  await t.run(async (ctx) => {
    const row = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", "staff"))
      .unique();
    await ctx.db.patch(row!._id, { active: false });
  });
  await expect(
    approved.mutation(internal.downloads.permit, {}),
  ).rejects.toThrow("FORBIDDEN");
});
it("throttles resume access separately and recovers after a minute", async () => {
  vi.useFakeTimers();
  const t = setup();
  const approved = await staff(t, "staff");
  for (let i = 0; i < 30; i++)
    expect(
      (await approved.mutation(internal.downloads.permit, {})).allowed,
    ).toBe(true);
  expect((await approved.mutation(internal.downloads.permit, {})).allowed).toBe(
    false,
  );
  expect((await approved.mutation(api.exports.begin, {})).allowed).toBe(true);
  vi.advanceTimersByTime(60001);
  expect((await approved.mutation(internal.downloads.permit, {})).allowed).toBe(
    true,
  );
});
