/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { applicationSchema } from "../../features/applications/schema";
import { previewLeads } from "../../features/leads/admin-types";
import {
  manilaDay,
  dayStart,
  previewOverview,
} from "../../features/admin/metrics";
import { previewJobs } from "../../features/jobs/preview-data";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  aggregate.register(t, "adminByTime");
  aggregate.register(t, "adminByStatus");
  rateLimiter.register(t);
  return t;
}
async function staff(t: ReturnType<typeof setup>) {
  await t.mutation(internal.provision.setStaff, {
    subject: "user_overview_staff",
    active: true,
  });
  return t.withIdentity({ subject: "user_overview_staff" });
}
const day = () => manilaDay(Date.now());
const options = () => ({ days: 30 as const, day: day() });
async function backfill(t: ReturnType<typeof setup>) {
  await t.mutation(internal.overview.startBackfill, {});
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
describe("Complete admin metrics and management", () => {
  it("requires approved staff for overview, priority, and deletion", async () => {
    const t = setup();
    await expect(t.query(api.overview.summary, options())).rejects.toThrow(
      "UNAUTHORIZED",
    );
    await expect(
      t
        .withIdentity({ subject: "unapproved" })
        .query(api.overview.summary, options()),
    ).rejects.toThrow("FORBIDDEN");
    const lead = previewLeads()[0];
    const id = await t.run((ctx) =>
      ctx.db.insert("businessLeads", {
        data: lead.data,
        status: "New",
        notes: "",
        reference: "test",
        submittedAt: Date.now(),
        submissionToken: "test",
        fingerprint: "test",
        consentVersion: "test",
      }),
    );
    await expect(
      t.mutation(api.admin.setPriority, { id, priority: true }),
    ).rejects.toThrow("UNAUTHORIZED");
    const admin = await staff(t);
    await t.mutation(internal.provision.setStaff, {
      subject: "user_overview_staff",
      active: false,
    });
    await expect(
      admin.mutation(api.admin.setPriority, { id, priority: true }),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("backfills more than one page, counts all records, respects Manila boundaries, and stays consistent after writes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T10:00:00Z"));
    const t = setup(),
      admin = await staff(t);
    const { website: _website, ...data } = applicationSchema.parse({
      firstName: "Sample",
      lastName: "Applicant",
      email: "test@example.invalid",
      phone: "09171234567",
      location: "Dagupan",
      position: "Support",
      privacyConsent: true,
    });
    void _website;
    const ids = await t.run(async (ctx) => {
      const ids = [];
      for (let i = 0; i < 61; i++)
        ids.push(
          await ctx.db.insert("applications", {
            data,
            reference: `test-${i}`,
            submittedAt: i === 0 ? dayStart(day()) - 1 : dayStart(day()),
            submissionToken: `test-${i}`,
            fingerprint: "test",
            consentVersion: "test",
            notes: "",
            status: "New",
          }),
        );
      return ids;
    });
    expect((await admin.query(api.overview.summary, options())).ready).toBe(
      false,
    );
    await backfill(t);
    let summary = await admin.query(api.overview.summary, options());
    expect(
      summary.applications.find((row) => row.status === "New")?.count,
    ).toBe(61);
    expect(summary.activity.at(-1)?.applications).toBe(60);
    expect(summary.activity.at(-2)?.applications).toBe(1);
    await admin.mutation(api.admin.update, {
      kind: "applications",
      id: ids[0],
      status: "Shortlisted",
      notes: "Private note should never appear in metrics",
    });
    await admin.mutation(api.admin.remove, {
      kind: "applications",
      id: ids[1],
    });
    summary = await admin.query(api.overview.summary, options());
    expect(summary.applications).toContainEqual({ status: "New", count: 59 });
    expect(summary.applications).toContainEqual({
      status: "Shortlisted",
      count: 1,
    });
    expect(summary.activity.at(-1)?.applications).toBe(59);
    expect(JSON.stringify(summary)).not.toContain("Private note");
    await backfill(t);
    expect(
      (await admin.query(api.overview.summary, options())).applications,
    ).toEqual(summary.applications);
    await expect(
      admin.query(api.overview.summary, { days: 30, day: day() + 8 }),
    ).rejects.toThrow("INVALID_DAY");
  });
  it("tracks live submissions, priority changes, filters and deletion without requiring a reload", async () => {
    vi.useFakeTimers();
    const t = setup(),
      admin = await staff(t);
    await backfill(t);
    const token = crypto.randomUUID(),
      data = previewLeads()[0].data;
    await t.mutation(internal.intake.reserve, {
      kind: "businessLeads",
      token,
      fingerprint: "test",
      rateKey: "lead-test",
    });
    await t.mutation(internal.intake.save, {
      kind: "businessLeads",
      token: `businessLeads:${token}`,
      fingerprint: "test",
      data,
    });
    const lead = await t.run((ctx) => ctx.db.query("businessLeads").first());
    expect(lead).not.toBeNull();
    await admin.mutation(api.admin.setPriority, {
      id: lead!._id,
      priority: true,
    });
    expect(
      (await admin.query(api.overview.summary, options())).priorityLeads,
    ).toBe(1);
    const args = {
      kind: "businessLeads" as const,
      priorityOnly: true,
      paginationOpts: { numItems: 20, cursor: null },
    };
    expect((await admin.query(api.admin.list, args)).page).toHaveLength(1);
    await admin.mutation(api.admin.update, {
      kind: "businessLeads",
      id: lead!._id,
      status: "Contacted",
      notes: "Follow up",
    });
    expect(
      (await admin.query(api.admin.list, { ...args, status: "New" })).page,
    ).toHaveLength(0);
    await admin.mutation(api.admin.setPriority, {
      id: lead!._id,
      priority: false,
    });
    expect((await admin.query(api.admin.list, args)).page).toHaveLength(0);
    await admin.mutation(api.admin.remove, {
      kind: "businessLeads",
      id: lead!._id,
    });
    const summary = await admin.query(api.overview.summary, options());
    expect(summary.priorityLeads).toBe(0);
    expect(summary.leads.every((row) => row.count === 0)).toBe(true);
  });
  it("archives jobs, restores only to draft, and prevents deletion with linked applications", async () => {
    vi.useFakeTimers();
    const t = setup(),
      admin = await staff(t);
    await backfill(t);
    const {
      _id: _id,
      status: _status,
      publishedAt: _published,
      updatedAt: _updated,
      ...data
    } = previewJobs()[0];
    void [_id, _status, _published, _updated];
    const id = await admin.mutation(api.jobs.save, { data });
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    await admin.mutation(api.jobs.setStatus, { id, status: "Archived" });
    expect(await t.query(api.jobs.detail, { id })).toBeNull();
    expect(
      (await admin.query(api.overview.summary, options())).jobs,
    ).toContainEqual({ status: "Archived", count: 1 });
    await expect(
      admin.mutation(api.jobs.setStatus, { id, status: "Published" }),
    ).rejects.toThrow("RESTORE_TO_DRAFT_FIRST");
    await admin.mutation(api.jobs.setStatus, { id, status: "Draft" });
    expect(await admin.query(api.jobs.deletionAllowed, { id })).toBe(true);
    const { website: _website, ...app } = applicationSchema.parse({
      firstName: "Sample",
      lastName: "Applicant",
      email: "linked@example.invalid",
      phone: "09171234567",
      location: "Dagupan",
      position: data.title,
      privacyConsent: true,
    });
    void _website;
    const applicationId = await t.run((ctx) =>
      ctx.db.insert("applications", {
        data: { ...app, jobId: id, jobTitle: data.title },
        status: "New",
        notes: "",
        reference: "linked",
        submittedAt: Date.now(),
        submissionToken: "linked",
        fingerprint: "linked",
        consentVersion: "test",
      }),
    );
    expect(await admin.query(api.jobs.deletionAllowed, { id })).toBe(false);
    await expect(admin.mutation(api.jobs.remove, { id })).rejects.toThrow(
      "JOB_HAS_APPLICATIONS",
    );
    await expect(t.mutation(api.jobs.remove, { id })).rejects.toThrow(
      "UNAUTHORIZED",
    );
    await admin.mutation(api.admin.remove, {
      kind: "applications",
      id: applicationId,
    });
    await admin.mutation(api.jobs.remove, { id });
    expect(await admin.query(api.jobs.staffDetail, { id })).toBeNull();
    expect(
      (await admin.query(api.overview.summary, options())).jobs.every(
        (row) => row.count === 0,
      ),
    ).toBe(true);
  });
  it("preview metrics mirror current records and zero-fill daily activity", () => {
    const leads = previewLeads();
    const result = previewOverview(
      [],
      leads,
      previewJobs(),
      7,
      manilaDay(Date.UTC(2026, 9, 1)),
    );
    expect(result.leads.reduce((sum, r) => sum + r.count, 0)).toBe(60);
    expect(result.jobs.find((r) => r.status === "Published")?.count).toBe(14);
    expect(result.activity).toHaveLength(7);
    expect(result.activity.every((r) => r.applications === 0)).toBe(true);
  });
});
