import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_productivity_test_${randomUUID()}`;
const marker = `synthetic-${randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, authenticated = true, denied) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(authenticated ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (denied) {
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(denied));
    return;
  }
  if (result.status !== 0)
    throw new Error(`Development verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
const ids = [];
try {
  run("provision:setStaff", { subject, active: true }, false);
  for (const kind of ["applications", "businessLeads"]) {
    const token = randomUUID();
    const body = new FormData();
    body.set("kind", kind);
    body.set("submissionToken", token);
    const fields = {
      privacyConsent: true,
      source: marker,
      campaign: marker,
      ...(kind === "applications"
        ? {
            firstName: "Synthetic",
            lastName: "Productivity",
            email: "productivity-test@example.invalid",
            phone: "09170000000",
            location: "Synthetic",
            position: "Synthetic test only",
          }
        : {
            company: "Synthetic productivity check",
            contactName: "Synthetic",
            email: "productivity-lead@example.invalid",
            phone: "09170000000",
            services: ["Customer Support"],
            message: "Synthetic development verification only.",
          }),
    };
    body.set("fields", JSON.stringify(fields));
    const response = await fetch(`${process.env.CONVEX_SITE_URL}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
        "x-rate-key": createHash("sha256").update(token).digest("hex"),
      },
      body,
    });
    assert.equal(response.status, 200);
    const list = run("admin:list", {
      kind,
      ...(kind === "applications" ? { filters: { campaign: marker } } : {}),
      paginationOpts: { cursor: null, numItems: 50 },
    });
    const row = list.page.find(
      (row) =>
        row.email === fields.email &&
        (kind !== "applications" || row.campaign === marker),
    );
    assert.ok(row);
    ids.push({ kind, id: row.id });
    if (kind === "applications") {
      for (const search of [
        row.reference,
        "Synthetic Productivity",
        fields.email,
      ]) {
        const filters = { search, campaign: marker };
        const found = run("admin:list", {
          kind,
          filters,
          paginationOpts: { cursor: null, numItems: 20 },
        });
        assert.equal(found.page.length, 1);
        assert.equal(found.page[0].id, row.id);
        const exported = run("exports:page", {
          filters,
          paginationOpts: { cursor: null, numItems: 100 },
        });
        assert.equal(exported.page[0]._id, row.id);
      }
      console.log(
        "Verified real application saves and indexed reference/name/email search with matching export.",
      );
    } else {
      run("admin:update", {
        kind,
        id: row.id,
        status: "Contacted",
        notes: "",
        nextFollowUp: "2026-01-01",
        expected: { status: "New", notes: "" },
      });
      const detail = run("admin:detail", { kind, id: row.id });
      assert.equal(detail.nextFollowUp, "2026-01-01");
      run(
        "admin:update",
        {
          kind,
          id: row.id,
          status: "Contacted",
          notes: "",
          nextFollowUp: "2026-01-02",
          expected: { status: "New", notes: "" },
        },
        true,
        "EDIT_CONFLICT",
      );
      const overview = run("overview:summary", {
        days: 7,
        day: Math.floor((Date.now() + 8 * 3600000) / 86400000),
      });
      assert.ok(overview.overdueLeads >= 1);
      assert.deepEqual(overview.recent, []);
      run("admin:update", {
        kind,
        id: row.id,
        status: "Closed",
        notes: "",
        nextFollowUp: null,
        expected: {
          status: "Contacted",
          notes: "",
          nextFollowUp: "2026-01-01",
        },
      });
      assert.equal(
        run("admin:detail", { kind, id: row.id }).nextFollowUp,
        undefined,
      );
      console.log(
        "Verified real follow-up saves, overdue totals, conflict rejection and date clearing.",
      );
    }
  }
  run(
    "admin:activity",
    { paginationOpts: { cursor: null, numItems: 20 } },
    true,
    "OWNER_REQUIRED",
  );
  run(
    "admin:activity",
    { paginationOpts: { cursor: null, numItems: 20 } },
    false,
    "UNAUTHORIZED",
  );
  console.log(
    "Verified Staff and anonymous activity denial. Owner access is covered by local backend tests; real Clerk browser sign-in is not verified.",
  );
} finally {
  try {
    for (const row of ids) run("admin:remove", row);
  } finally {
    run("provision:setStaff", { subject, active: false }, false);
  }
}
console.log(
  "Disposable records removed; temporary CLI Staff approval revoked. Audit history retained.",
);
