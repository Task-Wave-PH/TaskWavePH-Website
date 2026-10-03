/// <reference types="vite/client" />
import type { FunctionReturnType } from "convex/server";
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { describe, it, expect } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { applicationSchema } from "../../features/applications/schema";
const modules = import.meta.glob("../../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  const { website: _website, ...data } = applicationSchema.parse({
    firstName: "Synthetic",
    lastName: "Campaign",
    email: "campaign@example.invalid",
    phone: "09170000000",
    location: "Dagupan",
    position: "Synthetic",
    privacyConsent: true,
  });
  void _website;
  await t.run(async (ctx) => {
    await ctx.db.insert("adminUsers", { subject: "staff", active: true });
    for (let i = 0; i < 25; i++)
      await ctx.db.insert("applications", {
        data: {
          ...data,
          source: i % 2 ? "facebook" : "linkedin",
          campaign: "test-2026",
        },
        reference: `TW-TEST-${i}`,
        submissionToken: `test-${i}`,
        fingerprint: "synthetic",
        notes: "",
        consentVersion: "test",
        submittedAt: Date.parse("2026-10-02T12:00:00+08:00") + i,
        status: i % 3 ? "New" : "Reviewed",
      });
  });
  return { t, staff: t.withIdentity({ subject: "staff" }) };
}
describe("protected indexed campaign filtering", () => {
  it("paginates combinations without leaking unmatched records and exports the same matches", async () => {
    const { t, staff } = await setup();
    const filters = {
      source: "linkedin",
      campaign: "test-2026",
      from: "2026-10-02",
      to: "2026-10-02",
    };
    const rows = [];
    let cursor: string | null = null;
    for (let i = 0; i < 20; i++) {
      const page: FunctionReturnType<typeof api.admin.list> = await staff.query(
        api.admin.list,
        {
          kind: "applications",
          status: "Reviewed",
          filters,
          paginationOpts: { cursor, numItems: 4 },
        },
      );
      rows.push(...page.page);
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((row) => row.id)).size).toBe(5);
    expect(
      rows.every(
        (row) =>
          "source" in row &&
          row.source === "linkedin" &&
          row.status === "Reviewed",
      ),
    ).toBe(true);
    const exported = await staff.query(api.exports.page, {
      status: "Reviewed",
      filters,
      paginationOpts: { cursor: null, numItems: 100 },
    });
    expect(exported.page.map((row) => row._id)).toEqual(
      rows.map((row) => row.id),
    );
    await expect(
      t.query(api.admin.list, {
        kind: "applications",
        filters,
        paginationOpts: { cursor: null, numItems: 20 },
      }),
    ).rejects.toThrow("UNAUTHORIZED");
    await expect(
      t.withIdentity({ subject: "visitor" }).query(api.exports.page, {
        filters,
        paginationOpts: { cursor: null, numItems: 100 },
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("rejects malformed filters and excludes dates outside the indexed range", async () => {
    const { staff } = await setup();
    await expect(
      staff.query(api.admin.list, {
        kind: "applications",
        filters: { from: "2026-02-30" },
        paginationOpts: { cursor: null, numItems: 20 },
      }),
    ).rejects.toThrow("INVALID_FILTERS");
    expect(
      (
        await staff.query(api.exports.page, {
          filters: { from: "2026-10-03" },
          paginationOpts: { cursor: null, numItems: 100 },
        })
      ).page,
    ).toHaveLength(0);
  });
});
