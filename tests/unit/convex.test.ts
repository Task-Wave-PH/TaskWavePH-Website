/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { describe, it, expect, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { applicationSchema } from "../../features/applications/schema";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "adminByTime");
  aggregate.register(t, "adminByStatus");
  return t;
}
const input = {
  firstName: "Maria",
  lastName: "Santos",
  email: "maria@example.com",
  phone: "09171234567",
  location: "Cebu",
  position: "Support",
  privacyConsent: true,
};
const { website: _website, ...data } = applicationSchema.parse(input);
void _website;
async function save(t: ReturnType<typeof setup>, token = crypto.randomUUID()) {
  await t.mutation(internal.intake.reserve, {
    kind: "applications",
    token,
    fingerprint: "fingerprint",
    rateKey: crypto.randomUUID(),
  });
  const reference = await t.mutation(internal.intake.save, {
    kind: "applications",
    token: `applications:${token}`,
    fingerprint: "fingerprint",
    data,
  });
  const row = await t.run((ctx) => ctx.db.query("applications").first());
  return { row: row!, token, reference };
}
async function staff(t: ReturnType<typeof setup>) {
  await t.mutation(internal.provision.setStaff, {
    subject: "user_staff",
    active: true,
  });
  return t.withIdentity({
    subject: "user_staff",
    issuer: "https://clerk.test",
  });
}
const options = {
  kind: "applications" as const,
  paginationOpts: { numItems: 20, cursor: null },
};
describe("Convex intake and administration", () => {
  it("normalizes data, generates a reference and makes retries idempotent", async () => {
    const t = setup();
    const saved = await save(t);
    expect(saved.row.data.phone).toBe("+639171234567");
    expect(saved.reference).toMatch(/^TW-A-/);
    expect(
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: saved.token,
        fingerprint: "fingerprint",
        rateKey: "same",
      }),
    ).toEqual({ state: "complete", reference: saved.reference });
    await expect(
      t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: saved.token,
        fingerprint: "different",
        rateKey: "same",
      }),
    ).rejects.toThrow("TOKEN_CONFLICT");
    expect(
      await t.run((ctx) => ctx.db.query("applications").take(10)),
    ).toHaveLength(1);
  });
  it("reserves concurrent tokens and rejects invalid data at the final boundary", async () => {
    const t = setup();
    const token = crypto.randomUUID();
    const args = {
      kind: "applications" as const,
      token,
      fingerprint: "f",
      rateKey: "ip",
    };
    expect((await t.mutation(internal.intake.reserve, args)).state).toBe(
      "reserved",
    );
    expect((await t.mutation(internal.intake.reserve, args)).state).toBe(
      "busy",
    );
    await expect(
      t.mutation(internal.intake.save, {
        kind: "applications",
        token: `applications:${token}`,
        fingerprint: "f",
        data: { ...data, privacyConsent: false },
      }),
    ).rejects.toThrow();
    expect(
      await t.run((ctx) => ctx.db.query("applications").first()),
    ).toBeNull();
  });
  it("blocks unauthenticated and unapproved callers, including direct backend calls", async () => {
    const t = setup();
    const { row } = await save(t);
    await expect(t.query(api.admin.list, options)).rejects.toThrow(
      "UNAUTHORIZED",
    );
    const outsider = t.withIdentity({ subject: "user_outsider" });
    await expect(
      outsider.query(api.admin.detail, { kind: "applications", id: row._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.mutation(api.admin.remove, {
        kind: "applications",
        id: row._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.query(internal.downloads.find, { id: row._id }),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("supports paginated status lists, bounded notes and revocation", async () => {
    const t = setup();
    const admin = await staff(t);
    const { row } = await save(t);
    await admin.mutation(api.admin.update, {
      kind: "applications",
      id: row._id,
      status: "Shortlisted",
      notes: "Review completed",
    });
    expect(
      (await admin.query(api.admin.list, { ...options, status: "Shortlisted" }))
        .page,
    ).toHaveLength(1);
    await expect(
      admin.mutation(api.admin.update, {
        kind: "applications",
        id: row._id,
        status: "Hired",
        notes: "",
      }),
    ).rejects.toThrow("INVALID_STATUS");
    await expect(
      admin.mutation(api.admin.update, {
        kind: "applications",
        id: row._id,
        status: "New",
        notes: "x".repeat(2001),
      }),
    ).rejects.toThrow("NOTES_TOO_LONG");
    const events = await t.run((ctx) => ctx.db.query("adminActivity").take(10));
    expect(events.map((e) => e.action)).toEqual([
      "status_changed",
      "notes_updated",
    ]);
    expect(JSON.stringify(events)).not.toContain("Review completed");
    await t.mutation(internal.provision.setStaff, {
      subject: "user_staff",
      active: false,
    });
    await expect(admin.query(api.admin.list, options)).rejects.toThrow(
      "FORBIDDEN",
    );
  });
  it("removes the resume with its application and records metadata-only deletion", async () => {
    const t = setup();
    const admin = await staff(t);
    const token = crypto.randomUUID();
    await t.mutation(internal.intake.reserve, {
      kind: "applications",
      token,
      fingerprint: "f",
      rateKey: "ip",
    });
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF-test"], { type: "application/pdf" })),
    );
    await t.mutation(internal.intake.attach, {
      token: `applications:${token}`,
      storageId,
    });
    await t.mutation(internal.intake.save, {
      kind: "applications",
      token: `applications:${token}`,
      fingerprint: "f",
      data,
      resumeFile: {
        storageId,
        name: "resume.pdf",
        size: 9,
        contentType: "application/pdf",
      },
    });
    const row = await t.run((ctx) => ctx.db.query("applications").first());
    expect(
      await admin.query(internal.downloads.find, { id: row!._id }),
    ).toMatchObject({ storageId });
    const view = await admin.fetch(`/resume?id=${row!._id}&mode=view`);
    expect(view.status).toBe(200);
    expect(view.headers.get("content-disposition")).toContain("inline");
    expect(
      (
        await t.run((ctx) =>
          ctx.db
            .query("adminActivity")
            .withIndex("by_record", (q) => q.eq("record", row!._id))
            .take(10),
        )
      ).some((a) => a.action === "resume_viewed"),
    ).toBe(true);
    const download = await admin.fetch(`/resume?id=${row!._id}`);
    expect(download.status).toBe(200);
    expect(download.headers.get("content-disposition")).toContain("attachment");
    expect(download.headers.get("cache-control")).toContain("no-store");
    expect(await download.text()).toContain("%PDF-");

    await admin.mutation(api.admin.remove, {
      kind: "applications",
      id: row!._id,
    });
    expect(await t.run((ctx) => ctx.db.get(row!._id))).toBeNull();
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
  });
  it("cleans expired uploads and preserves attached resumes", async () => {
    const t = setup();
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF-test"])),
    );
    await t.run((ctx) =>
      ctx.db.insert("pendingUploads", {
        submissionToken: "old",
        fingerprint: "f",
        expiresAt: 0,
        storageId,
      }),
    );
    await t.mutation(internal.intake.cleanup, {});
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
    expect(
      await t.run((ctx) => ctx.db.query("pendingUploads").first()),
    ).toBeNull();
  });
  it("commits persistent attempt limits and returns retry timing", async () => {
    const t = setup();
    const rateKey = "b".repeat(64);
    for (let index = 0; index < 20; index++)
      expect(
        (await t.mutation(internal.intake.attempt, { rateKey })).allowed,
      ).toBe(true);
    const denied = await t.mutation(internal.intake.attempt, { rateKey });
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(
      (await t.mutation(internal.intake.attempt, { rateKey })).allowed,
    ).toBe(false);
    expect(
      (await t.mutation(internal.intake.attempt, { rateKey: "c".repeat(64) }))
        .allowed,
    ).toBe(true);
  });
  it("authenticates attempt checks and applies a shared global budget", async () => {
    const t = setup();
    vi.stubEnv("CONVEX_SERVER_SECRET", "development-test-secret");
    expect(
      (await t.fetch("/submission-attempt", { method: "POST" })).status,
    ).toBe(401);
    const headers = {
      Authorization: "Bearer development-test-secret",
      "x-rate-key": "a".repeat(64),
    };
    for (let index = 0; index < 120; index++)
      await t.mutation(internal.intake.attempt, {
        rateKey: index.toString(16).padStart(64, "0"),
      });
    const response = await t.fetch("/submission-attempt", {
      method: "POST",
      headers,
    });
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });
  it("limits repeated submissions persistently", async () => {
    const t = setup();
    for (let index = 0; index < 5; index++)
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: crypto.randomUUID(),
        fingerprint: "f",
        rateKey: "same-ip",
      });
    await expect(
      t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: crypto.randomUUID(),
        fingerprint: "f",
        rateKey: "same-ip",
      }),
    ).rejects.toThrow("RATE_LIMITED");
  });
  it("rejects unauthenticated HTTP writes and file downloads", async () => {
    const t = setup();
    vi.stubEnv("CONVEX_SERVER_SECRET", "secret");
    expect(
      (await t.fetch("/submit", { method: "POST", body: "bad" })).status,
    ).toBe(401);
    expect((await t.fetch("/resume?id=unknown")).status).toBe(403);
    vi.unstubAllEnvs();
  });
  it("exports all filtered pages, hides storage secrets and rechecks approval", async () => {
    const t = setup();
    const admin = await staff(t);
    for (let i = 0; i < 25; i++)
      await t.run((ctx) =>
        ctx.db.insert("applications", {
          data,
          reference: `test-${i}`,
          submittedAt: i,
          consentVersion: "test",
          status: i % 2 ? "New" : "Reviewed",
          notes: "",
          submissionToken: `test-${i}`,
          fingerprint: "secret",
        }),
      );
    const first = await admin.query(api.exports.page, {
      status: "New",
      paginationOpts: { numItems: 5, cursor: null },
    });
    const second = await admin.query(api.exports.page, {
      status: "New",
      paginationOpts: { numItems: 100, cursor: first.continueCursor },
    });
    expect(first.page.length + second.page.length).toBe(12);
    expect(first.page[0]).not.toHaveProperty("fingerprint");
    expect(first.page[0]).not.toHaveProperty("submissionToken");
    await admin.mutation(api.exports.audit, { format: "csv", count: 12 });
    await t.mutation(internal.provision.setStaff, {
      subject: "user_staff",
      active: false,
    });
    await expect(
      admin.query(api.exports.page, {
        paginationOpts: { numItems: 100, cursor: null },
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(api.exports.page, {
        paginationOpts: { numItems: 100, cursor: null },
      }),
    ).rejects.toThrow("UNAUTHORIZED");
  });
  it("creates idempotent development seeds and cleans only its own records", async () => {
    const t = setup();
    await expect(t.action(internal.seed.run, {})).rejects.toThrow(
      "SEED_DISABLED",
    );
    vi.stubEnv("ALLOW_DEVELOPMENT_SEED", "true");
    try {
      await save(t);
      expect(await t.action(internal.seed.run, {})).toEqual({ created: 50 });
      expect(await t.action(internal.seed.run, {})).toEqual({ created: 0 });
      const rows = await t.run((ctx) => ctx.db.query("applications").take(100));
      const fileIds = rows.flatMap((r) =>
        r.resumeFile ? [r.resumeFile.storageId] : [],
      );
      expect(fileIds.length).toBe(5);
      expect(await t.mutation(internal.seed.cleanup, {})).toBe(50);
      expect(
        await t.run((ctx) => ctx.db.query("applications").take(100)),
      ).toHaveLength(1);
      for (const id of fileIds)
        expect(await t.run((ctx) => ctx.storage.get(id))).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
