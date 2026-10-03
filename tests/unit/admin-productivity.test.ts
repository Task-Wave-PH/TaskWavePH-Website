/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregate from "@convex-dev/aggregate/test";
import { describe, it, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { previewApplicants } from "../../features/applications/preview-data";
import { previewLeads } from "../../features/leads/admin-types";
import { applicantSearchText } from "../../features/applications/search";
import { manilaDay } from "../../features/admin/metrics";
const modules = import.meta.glob("../../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  aggregate.register(t, "adminByTime");
  aggregate.register(t, "adminByStatus");
  await t.run(async (ctx) => {
    await ctx.db.insert("adminUsers", {
      subject: "owner",
      role: "Owner",
      active: true,
      name: "Test owner",
    });
    await ctx.db.insert("adminUsers", {
      subject: "staff",
      role: "Staff",
      active: true,
    });
    await ctx.db.insert("dashboardState", { key: "overview-v1", ready: true });
  });
  return {
    t,
    staff: t.withIdentity({ subject: "staff" }),
    owner: t.withIdentity({ subject: "owner" }),
  };
}
afterEach(() => vi.useRealTimers());
it("searches reference, name and email in the database with the same export filters", async () => {
  const { t, staff } = await setup();
  const sample = previewApplicants()[0];
  await t.run(async (ctx) => {
    for (const [reference, lastName, email] of [
      ["TW-ABC-123", "Rivera", "maria.rivera@example.invalid"],
      ["TW-DEF-456", "Santos", "maria.santos@example.invalid"],
    ]) {
      const row = {
        reference,
        data: { ...sample.data, firstName: "Maria", lastName, email },
      };
      await ctx.db.insert("applications", {
        ...row,
        searchText: applicantSearchText(row),
        submittedAt: Date.now(),
        status: "New",
        notes: "",
        consentVersion: "test",
        submissionToken: reference,
        fingerprint: "test",
      });
    }
  });
  for (const search of [
    "TW-ABC-123",
    "Maria Rive",
    "maria.rivera@example.invalid",
  ]) {
    const args = {
      filters: { search },
      paginationOpts: { cursor: null, numItems: 20 },
    };
    const result = await staff.query(api.admin.list, {
      kind: "applications",
      ...args,
    });
    expect(result.page.map((row) => row.reference)).toEqual(["TW-ABC-123"]);
    expect(
      (await staff.query(api.exports.page, args)).page.map(
        (row) => row.reference,
      ),
    ).toEqual(["TW-ABC-123"]);
  }
  await expect(
    t.query(api.admin.list, {
      kind: "applications",
      filters: { search: "Maria" },
      paginationOpts: { cursor: null, numItems: 20 },
    }),
  ).rejects.toThrow("UNAUTHORIZED");
});
it("backfills historical search fields and provides distinct codes without personal data", async () => {
  const { t, staff } = await setup();
  const sample = previewApplicants()[0];
  const id = await t.run((ctx) =>
    ctx.db.insert("applications", {
      data: sample.data,
      reference: sample.reference,
      submittedAt: Date.now(),
      status: "New",
      notes: "",
      consentVersion: "test",
      submissionToken: "legacy",
      fingerprint: "test",
    }),
  );
  await t.mutation(internal.admin.backfillSearch, { cursor: null });
  expect((await t.run((ctx) => ctx.db.get(id)))?.searchText).toBe(
    applicantSearchText(sample),
  );
  expect(await staff.query(api.admin.attributionOptions, {})).toEqual({
    sources: ["development-preview"],
    campaigns: ["sample-campaign"],
  });
});
it("restricts paginated activity to active Owners and resolves staff labels", async () => {
  const { t, staff, owner } = await setup();
  await t.run((ctx) =>
    ctx.db.insert("adminActivity", {
      actor: "owner",
      record: "applications",
      action: "export_pdf_2",
      timestamp: Date.now(),
    }),
  );
  const args = { paginationOpts: { cursor: null, numItems: 20 } };
  await expect(t.query(api.admin.activity, args)).rejects.toThrow(
    "UNAUTHORIZED",
  );
  await expect(staff.query(api.admin.activity, args)).rejects.toThrow(
    "OWNER_REQUIRED",
  );
  const page = await owner.query(api.admin.activity, args);
  expect(page.page[0].actorLabel).toBe("Test owner");
  expect(Object.keys(page.page[0]).sort()).toEqual([
    "action",
    "actor",
    "actorLabel",
    "id",
    "record",
    "timestamp",
  ]);
  await t.run(async (ctx) => {
    const row = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", "owner"))
      .unique();
    await ctx.db.patch(row!._id, { active: false });
  });
  await expect(owner.query(api.admin.activity, args)).rejects.toThrow(
    "FORBIDDEN",
  );
});
describe("lead follow-up dates", () => {
  it("counts overdue open enquiries, excludes today/closed, removes cleared dates and rejects stale edits", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T02:00:00Z"));
    const { t, staff } = await setup();
    const sample = previewLeads()[0];
    const id = await t.run((ctx) =>
      ctx.db.insert("businessLeads", {
        data: sample.data,
        reference: "TW-LEAD-TEST",
        submittedAt: Date.now(),
        status: "New",
        notes: "",
        consentVersion: "test",
        submissionToken: "lead",
        fingerprint: "test",
      }),
    );
    const base = {
      kind: "businessLeads" as const,
      id,
      status: "New",
      notes: "",
    };
    const summary = () =>
      staff.query(api.overview.summary, {
        days: 7,
        day: manilaDay(Date.now()),
      });
    await staff.mutation(api.admin.update, {
      ...base,
      nextFollowUp: "2026-10-02",
      expected: { status: "New", notes: "" },
    });
    expect((await summary()).overdueLeads).toBe(1);
    await expect(
      staff.mutation(api.admin.update, {
        ...base,
        nextFollowUp: "2026-10-01",
        expected: { status: "New", notes: "" },
      }),
    ).rejects.toThrow("EDIT_CONFLICT");
    await staff.mutation(api.admin.update, {
      ...base,
      nextFollowUp: "2026-10-03",
      expected: { status: "New", notes: "", nextFollowUp: "2026-10-02" },
    });
    expect((await summary()).overdueLeads).toBe(0);
    await staff.mutation(api.admin.update, {
      ...base,
      status: "Closed",
      nextFollowUp: "2026-10-01",
      expected: { status: "New", notes: "", nextFollowUp: "2026-10-03" },
    });
    expect((await summary()).overdueLeads).toBe(0);
    await staff.mutation(api.admin.update, {
      ...base,
      status: "Contacted",
      expected: { status: "Closed", notes: "" },
    });
    expect((await summary()).overdueLeads).toBe(1);
    await staff.mutation(api.admin.update, {
      ...base,
      status: "Contacted",
      nextFollowUp: null,
      expected: { status: "Contacted", notes: "", nextFollowUp: "2026-10-01" },
    });
    expect((await summary()).overdueLeads).toBe(0);
    for (const nextFollowUp of ["", "2026-02-30", "2101-01-01"])
      await expect(
        staff.mutation(api.admin.update, {
          ...base,
          nextFollowUp,
          expected: { status: "Contacted", notes: "" },
        }),
      ).rejects.toThrow("INVALID_FOLLOW_UP");
  });
});

it("finds a long valid email through the exact email index", async () => {
  const { t, staff } = await setup();
  const sample = previewApplicants()[0];
  const email = `${"a".repeat(40)}@example.invalid`;
  await t.run((ctx) =>
    ctx.db.insert("applications", {
      data: { ...sample.data, email },
      reference: "TW-LONG",
      submittedAt: Date.now(),
      status: "New",
      notes: "",
      consentVersion: "test",
      submissionToken: "long-email",
      fingerprint: "test",
    }),
  );
  const result = await staff.query(api.admin.list, {
    kind: "applications",
    filters: { search: email.toUpperCase() },
    paginationOpts: { cursor: null, numItems: 20 },
  });
  expect(result.page.map((row) => row.email)).toEqual([email]);
});
