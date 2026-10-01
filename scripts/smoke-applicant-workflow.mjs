import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = "user_taskwaveph_development_workflow_test";
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, staff = false, expectFailure = false) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(staff ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (expectFailure) {
    assert.notEqual(result.status, 0);
    return;
  }
  if (result.status !== 0)
    throw new Error(
      `Development workflow failed at ${name}: ${result.stderr.slice(0, 1000)}`,
    );
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
try {
  run("provision:setStaff", { subject, active: true });
  const pages = [];
  let cursor = null;
  do {
    const result = run(
      "exports:page",
      { paginationOpts: { numItems: 10, cursor } },
      true,
    );
    pages.push(...result.page);
    cursor = result.isDone ? null : result.continueCursor;
  } while (cursor);
  const seeded = pages.filter((r) => r.data.source === "development-seed-v1");
  assert.equal(seeded.length, 50);
  const record = seeded.find((r) => r.reference === "TW-SEED-001");
  assert.ok(record.resumeFile);
  run(
    "admin:update",
    {
      kind: "applications",
      id: record._id,
      status: "Shortlisted",
      notes: "Synthetic workflow review.",
    },
    true,
  );
  const detail = run(
    "admin:detail",
    { kind: "applications", id: record._id },
    true,
  );
  assert.equal(detail.status, "Shortlisted");
  assert.equal(detail.notes, "Synthetic workflow review.");
  assert.ok(detail.resumeFile.storageId);
  const filtered = run(
    "exports:page",
    { status: "Shortlisted", paginationOpts: { numItems: 100, cursor: null } },
    true,
  );
  assert.ok(filtered.page.some((r) => r._id === record._id));
  run(
    "admin:update",
    {
      kind: "applications",
      id: record._id,
      status: record.status,
      notes: record.notes,
    },
    true,
  );
  const deletable = seeded.find((r) => r.reference === "TW-SEED-005");
  run("admin:remove", { kind: "applications", id: deletable._id }, true);
  assert.equal(
    run("admin:detail", { kind: "applications", id: deletable._id }, true),
    null,
  );
  run(
    "exports:page",
    { paginationOpts: { numItems: 10, cursor: null } },
    false,
    true,
  );
} finally {
  run("provision:setStaff", { subject, active: false });
}
run(
  "exports:page",
  { paginationOpts: { numItems: 10, cursor: null } },
  true,
  true,
);
console.log(
  "Local Convex workflow passed: paginated export, filtered export, applicant detail, status/notes update, authorized CV metadata, deletion, and denied/revoked access. Trusted CLI test identity was revoked; this is not a real Clerk login test. Run convex:seed again to restore the deleted sample.",
);
