import { plainTextDocument } from "../../features/jobs/rich-text";
import {
  jobSlugBase,
  numberedJobSlug,
  jobApplyHref,
} from "../../features/jobs/urls";
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { describe, it, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { jobSchema } from "../../features/jobs/schema";
import { applicationSchema } from "../../features/applications/schema";
import { toCsv } from "../../features/applications/export";
import { previewApplicants } from "../../features/applications/preview-data";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "adminByTime");
  aggregate.register(t, "adminByStatus");
  return t;
}
async function staff(t: ReturnType<typeof setup>) {
  await t.mutation(internal.provision.setStaff, {
    subject: "user_jobs",
    active: true,
  });
  return t.withIdentity({ subject: "user_jobs" });
}
const data = jobSchema.parse({
  title: "Support Specialist",
  serviceArea: "Customer Support",
  location: "Cebu",
  arrangement: "Remote",
  employmentType: "Full-time",
  description: "Support customers with their questions and everyday concerns.",
  responsibilities: "Respond clearly to customer enquiries.",
  requirements: "Clear communication and relevant experience.",
  salary: "",
});
const page = { paginationOpts: { numItems: 12, cursor: null } };
afterEach(() => vi.unstubAllEnvs());
describe("Jobs", () => {
  it("preserves formatted content on older metadata edits and rejects older body edits", async () => {
    const t = setup();
    const admin = await staff(t);
    const richText = { description: plainTextDocument(data.description) };
    const id = await admin.mutation(api.jobs.save, {
      data: { ...data, richText },
    });
    const first = await admin.query(api.jobs.staffDetail, { id });
    await admin.mutation(api.jobs.save, {
      id,
      data: { ...data, title: "Updated title" },
      expectedUpdatedAt: first!.updatedAt,
    });
    const second = await admin.query(api.jobs.staffDetail, { id });
    expect(second!.richText).toEqual(richText);
    await expect(
      admin.mutation(api.jobs.save, {
        id,
        data: { ...data, description: "Changed by an outdated editor client." },
        expectedUpdatedAt: second!.updatedAt,
      }),
    ).rejects.toThrow("EDITOR_REFRESH_REQUIRED");
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    expect((await t.query(api.jobs.detail, { id }))!.richText).toEqual(
      richText,
    );
  });
  it("rejects stale job edits and advances revisions within the same millisecond", async () => {
    vi.useFakeTimers();
    try {
      const t = setup();
      const admin = await staff(t);
      const id = await admin.mutation(api.jobs.save, { data });
      const first = await admin.query(api.jobs.staffDetail, { id });
      await admin.mutation(api.jobs.save, {
        id,
        data: { ...data, title: "Newer title" },
        expectedUpdatedAt: first!.updatedAt,
      });
      const second = await admin.query(api.jobs.staffDetail, { id });
      expect(second!.updatedAt).toBeGreaterThan(first!.updatedAt);
      await expect(
        admin.mutation(api.jobs.save, {
          id,
          data: { ...data, title: "Stale title" },
          expectedUpdatedAt: first!.updatedAt,
        }),
      ).rejects.toThrow("EDIT_CONFLICT");
      expect((await admin.query(api.jobs.staffDetail, { id }))!.title).toBe(
        "Newer title",
      );
      await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
      await expect(
        admin.mutation(api.jobs.save, {
          id,
          data,
          expectedUpdatedAt: second!.updatedAt,
        }),
      ).rejects.toThrow("EDIT_CONFLICT");
    } finally {
      vi.useRealTimers();
    }
  });
  it("denies anonymous, unapproved and revoked staff writes", async () => {
    const t = setup();
    await expect(t.mutation(api.jobs.save, { data })).rejects.toThrow(
      "UNAUTHORIZED",
    );
    const denied = t.withIdentity({ subject: "not_approved" });
    await expect(denied.mutation(api.jobs.save, { data })).rejects.toThrow(
      "FORBIDDEN",
    );
    const approved = await staff(t);
    const id = await approved.mutation(api.jobs.save, { data });
    await t.mutation(internal.provision.setStaff, {
      subject: "user_jobs",
      active: false,
    });
    await expect(
      approved.mutation(api.jobs.setStatus, { id, status: "Published" }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.query(api.jobs.staffList, page)).rejects.toThrow(
      "UNAUTHORIZED",
    );
  });
  it("keeps drafts and closed roles private, projects public data, audits transitions", async () => {
    const t = setup();
    const admin = await staff(t);
    const id = await admin.mutation(api.jobs.save, { data });
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(0);
    expect(await t.query(api.jobs.detail, { id })).toBeNull();
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    const published = await t.query(api.jobs.detail, { id });
    expect(published?.title).toBe(data.title);
    expect(published).not.toHaveProperty("_creationTime");
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(1);
    await admin.mutation(api.jobs.save, {
      id,
      data: { ...data, title: "Updated Role" },
    });
    await admin.mutation(api.jobs.setStatus, { id, status: "Closed" });
    expect(await t.query(api.jobs.detail, { id })).toBeNull();
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(0);
    expect(await admin.query(api.jobs.staffDetail, { id })).toMatchObject({
      title: "Updated Role",
      status: "Closed",
    });
    const audit = await t.run((ctx) => ctx.db.query("adminActivity").take(10));
    expect(audit).toHaveLength(4);
    expect(JSON.stringify(audit)).not.toContain("Updated Role");
  });
  it("paginates and combines filters with newest publications first", async () => {
    const t = setup();
    const admin = await staff(t);
    for (let i = 0; i < 15; i++) {
      const id = await admin.mutation(api.jobs.save, {
        data: {
          ...data,
          title: `Support ${i}`,
          arrangement: i % 2 ? "Hybrid" : "Remote",
        },
      });
      await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    }
    const first = await t.query(api.jobs.published, page);
    expect(first.page).toHaveLength(12);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.jobs.published, {
      paginationOpts: { numItems: 12, cursor: first.continueCursor },
    });
    expect(second.page).toHaveLength(3);
    expect(
      new Set([...first.page, ...second.page].map((j) => j._id)).size,
    ).toBe(15);
    const filtered = await t.query(api.jobs.published, {
      ...page,
      serviceArea: "Customer Support",
      arrangement: "Remote",
    });
    expect(filtered.page).toHaveLength(8);
    expect(
      (
        await t.query(api.jobs.published, {
          ...page,
          serviceArea: "Web Development",
        })
      ).page,
    ).toHaveLength(0);
  });
  it("rejects invalid content and safely handles forged ids", async () => {
    const t = setup();
    const admin = await staff(t);
    await expect(
      admin.mutation(api.jobs.save, { data: { ...data, title: "" } }),
    ).rejects.toThrow("INVALID_JOB");
    await expect(
      t.query(api.jobs.published, {
        paginationOpts: { numItems: 101, cursor: null },
      }),
    ).rejects.toThrow();
    expect(await t.query(api.jobs.detail, { id: "forged" })).toBeNull();
  });
  it("links an application to the canonical title and preserves retry after closure", async () => {
    vi.stubEnv("CONVEX_SERVER_SECRET", "jobs-secret");
    const t = setup();
    const admin = await staff(t);
    const id = await admin.mutation(api.jobs.save, { data });
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    const token = crypto.randomUUID();
    const fields = {
      firstName: "Sample",
      lastName: "Applicant",
      email: "sample@example.invalid",
      phone: "09171234567",
      location: "Cebu",
      position: "Forged position",
      privacyConsent: true,
      jobId: id,
      jobTitle: "Forged snapshot",
    };
    const send = async () => {
      const body = new FormData();
      body.set("kind", "applications");
      body.set("fields", JSON.stringify(fields));
      body.set("submissionToken", token);
      return t.fetch("/submit", {
        method: "POST",
        headers: {
          Authorization: "Bearer jobs-secret",
          "x-rate-key": "a".repeat(64),
        },
        body,
      });
    };
    const first = await send();
    expect(first.status).toBe(200);
    const saved = await first.json();
    const app = await t.run((ctx) => ctx.db.query("applications").first());
    expect(app?.data).toMatchObject({
      jobId: id,
      jobTitle: data.title,
      position: data.title,
    });
    await admin.mutation(api.jobs.setStatus, { id, status: "Closed" });
    expect(await (await send()).json()).toEqual(saved);
    const newToken = crypto.randomUUID();
    const body = new FormData();
    body.set("kind", "applications");
    body.set("fields", JSON.stringify(fields));
    body.set("submissionToken", newToken);
    body.set(
      "resumeFile",
      new Blob(["%PDF-1.4\nSynthetic test\n%%EOF"], {
        type: "application/pdf",
      }),
      "test.pdf",
    );
    const denied = await t.fetch("/submit", {
      method: "POST",
      headers: {
        Authorization: "Bearer jobs-secret",
        "x-rate-key": "b".repeat(64),
      },
      body,
    });
    expect(denied.status).toBe(409);
    expect(await denied.json()).toMatchObject({ error: "JOB_UNAVAILABLE" });
    expect(
      await t.run((ctx) => ctx.db.query("pendingUploads").take(10)),
    ).toHaveLength(0);
    expect(
      await t.run((ctx) => ctx.db.system.query("_storage").take(10)),
    ).toHaveLength(0);
  });
  it("rejects forged job associations and leaves general applications compatible", async () => {
    const t = setup();
    const fields = applicationSchema.parse({
      firstName: "Sample",
      lastName: "Applicant",
      email: "sample@example.invalid",
      phone: "09171234567",
      location: "Cebu",
      position: "General",
      privacyConsent: true,
    });
    const { website: _website, ...normalized } = fields;
    void _website;
    const token = crypto.randomUUID();
    await t.mutation(internal.intake.reserve, {
      kind: "applications",
      token,
      fingerprint: "f",
      rateKey: "test",
    });
    await expect(
      t.mutation(internal.intake.save, {
        kind: "applications",
        token: `applications:${token}`,
        fingerprint: "f",
        data: { ...normalized, jobId: "forged" },
      }),
    ).rejects.toThrow("JOB_UNAVAILABLE");
    await t.mutation(internal.intake.save, {
      kind: "applications",
      token: `applications:${token}`,
      fingerprint: "f",
      data: normalized,
    });
    expect(
      (await t.run((ctx) => ctx.db.query("applications").first()))?.data.jobId,
    ).toBeUndefined();
  });
  it("exports associated role information as safe text", () => {
    const row = previewApplicants()[0];
    row.data.jobId = "sample-job";
    row.data.jobTitle = "=malicious";
    const csv = toCsv([row]);
    expect(csv).toContain('"Job Title at Application"');
    expect(csv).toContain('"\'=malicious"');
    expect(csv).toContain('"sample-job"');
  });
});

describe("Readable job URLs", () => {
  it("normalizes titles and uses the Philippine publication date", () => {
    expect(
      jobSlugBase(
        "  Sénior Support / Sales!  ",
        Date.parse("2026-10-21T16:00:00Z"),
      ),
    ).toBe("senior-support-sales-2026-10-22");
    expect(jobSlugBase("!!!", 0)).toBe("role-1970-01-01");
    expect(jobSlugBase("x".repeat(200), 0)).toBe(
      `${"x".repeat(100)}-1970-01-01`,
    );
    expect(numberedJobSlug("support-2026-10-22", 101)).toBe(
      "support-2026-10-22-101",
    );
  });
  it("retains tracking without including personal or arbitrary query values", () => {
    expect(
      jobApplyHref(
        { _id: "id", slug: "support-2026-10-22-01" },
        { source: "linkedin", email: "secret@example.invalid", jobId: "other" },
      ),
    ).toBe("/apply/support-2026-10-22-01?source=linkedin");
    expect(jobApplyHref({ _id: "id" }, { campaign: "october" })).toBe(
      "/apply?jobId=id&campaign=october",
    );
  });
  it("allocates unique publication slugs, preserves them and never reuses deleted URLs", async () => {
    const t = setup(),
      admin = await staff(t);
    const ids = await Promise.all([
      admin.mutation(api.jobs.save, { data }),
      admin.mutation(api.jobs.save, { data }),
    ]);
    expect(
      (await admin.query(api.jobs.staffDetail, { id: ids[0] }))?.slug,
    ).toBeUndefined();
    await Promise.all(
      ids.map((id) =>
        admin.mutation(api.jobs.setStatus, { id, status: "Published" }),
      ),
    );
    const first = await admin.query(api.jobs.staffDetail, { id: ids[0] });
    const second = await admin.query(api.jobs.staffDetail, { id: ids[1] });
    expect(first!.slug).not.toBe(second!.slug);
    expect(await t.query(api.jobs.detail, { id: first!.slug! })).toMatchObject({
      _id: ids[0],
    });
    await admin.mutation(api.jobs.save, {
      id: ids[0],
      data: { ...data, title: "Renamed position" },
      expectedUpdatedAt: first!.updatedAt,
    });
    await admin.mutation(api.jobs.setStatus, { id: ids[0], status: "Closed" });
    expect(await t.query(api.jobs.detail, { id: first!.slug! })).toBeNull();
    await admin.mutation(api.jobs.setStatus, {
      id: ids[0],
      status: "Published",
    });
    expect((await t.query(api.jobs.detail, { id: ids[0] }))!.slug).toBe(
      first!.slug,
    );
    await admin.mutation(api.jobs.remove, { id: ids[1] });
    const third = await admin.mutation(api.jobs.save, { data });
    await admin.mutation(api.jobs.setStatus, {
      id: third,
      status: "Published",
    });
    expect((await t.query(api.jobs.detail, { id: third }))!.slug).not.toBe(
      second!.slug,
    );
    expect(await t.query(api.jobs.detail, { id: second!.slug! })).toBeNull();
    expect(await t.query(api.jobs.detail, { id: "x".repeat(1000) })).toBeNull();
  });
  it("backfills historical roles without altering revisions, skipping unpublished drafts", async () => {
    const t = setup();
    const ids = await t.run(async (ctx) => {
      const a = await ctx.db.insert("jobs", {
        ...data,
        status: "Published",
        publishedAt: Date.UTC(2026, 8, 1),
        updatedAt: 123,
      });
      const b = await ctx.db.insert("jobs", {
        ...data,
        status: "Draft",
        updatedAt: 124,
      });
      const c = await ctx.db.insert("jobs", {
        ...data,
        status: "Closed",
        publishedAt: Date.UTC(2026, 8, 1),
        updatedAt: 125,
      });
      return [a, b, c];
    });
    expect(
      await t.mutation(internal.jobSlugs.backfill, { cursor: null }),
    ).toEqual({ processed: 2, done: true });
    const before = await t.run((ctx) => ctx.db.get(ids[0]));
    expect(before!.slug).toBe("support-specialist-2026-09-01-01");
    expect(before!.updatedAt).toBe(123);
    expect((await t.run((ctx) => ctx.db.get(ids[1])))!.slug).toBeUndefined();
    expect(
      await t.mutation(internal.jobSlugs.backfill, { cursor: null }),
    ).toEqual({ processed: 0, done: true });
    expect((await t.run((ctx) => ctx.db.get(ids[0])))!.slug).toBe(before!.slug);
  });
});

it("completes historical slug migration across bounded scheduled pages", async () => {
  vi.useFakeTimers();
  try {
    const t = setup();
    await t.run(async (ctx) => {
      for (let i = 0; i < 51; i++)
        await ctx.db.insert("jobs", {
          ...data,
          status: "Published",
          publishedAt: Date.UTC(2026, 9, 22),
          updatedAt: 1,
        });
    });
    expect(
      await t.mutation(internal.jobSlugs.backfill, { cursor: null }),
    ).toEqual({ processed: 50, done: false });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const rows = await t.run((ctx) => ctx.db.query("jobs").take(100));
    expect(rows).toHaveLength(51);
    expect(new Set(rows.map((row) => row.slug)).size).toBe(51);
    expect(rows.every((row) => row.slug && row.updatedAt === 1)).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

it("does not give never-published closed or archived drafts an early URL", async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
    const t = setup(),
      admin = await staff(t);
    const ids = await t.run(async (ctx) => {
      const ids = [];
      for (const status of ["Closed", "Archived"] as const) {
        ids.push(
          await ctx.db.insert("jobs", {
            ...data,
            status,
            updatedAt: Date.now(),
          }),
        );
      }
      return ids;
    });
    vi.setSystemTime(new Date("2026-10-21T16:00:00Z"));
    expect(
      await t.mutation(internal.jobSlugs.backfill, { cursor: null }),
    ).toEqual({ processed: 0, done: true });
    for (const id of ids) {
      expect(
        (await admin.query(api.jobs.staffDetail, { id }))!.slug,
      ).toBeUndefined();
      expect(await t.query(api.jobs.detail, { id })).toBeNull();
      await admin.mutation(api.jobs.setStatus, { id, status: "Draft" });
      await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
      expect((await t.query(api.jobs.detail, { id }))!.slug).toMatch(
        /^support-specialist-2026-10-22-0[12]$/,
      );
    }
  } finally {
    vi.useRealTimers();
  }
});
