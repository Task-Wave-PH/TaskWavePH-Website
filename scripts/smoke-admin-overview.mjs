import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_admin_overview_test_${crypto.randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, staff = false, failure) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(staff ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 30_000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (failure) {
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(failure));
    return null;
  }
  if (result.status !== 0)
    throw new Error(`Development overview verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
const stats = () =>
  run(
    "overview:summary",
    { days: 30, day: Math.floor((Date.now() + 8 * 3_600_000) / 86_400_000) },
    true,
  );
const total = (rows) => rows.reduce((sum, row) => sum + row.count, 0);
const data = {
  title: "Synthetic Admin Workflow - Not a Vacancy",
  serviceArea: "Customer Support",
  location: "Synthetic test location",
  arrangement: "Remote",
  employmentType: "Contract",
  description:
    "Synthetic development record only, removed after workflow verification. Not a real vacancy.",
  responsibilities: "Synthetic management verification only.",
  requirements: "Synthetic management verification only.",
  salary: "",
};
const records = [];
let jobId;
async function submit(kind, fields) {
  const token = crypto.randomUUID();
  const body = new FormData();
  body.set("kind", kind);
  body.set("fields", JSON.stringify(fields));
  body.set("submissionToken", token);
  const response = await fetch(`${process.env.CONVEX_SITE_URL}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
      "x-rate-key": createHash("sha256").update(token).digest("hex"),
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  const page = run(
    "admin:list",
    { kind, paginationOpts: { cursor: null, numItems: 20 } },
    true,
  );
  const row = page.page.find((row) => row.reference === result.reference);
  assert.ok(row);
  records.push({ kind, id: row.id });
  return row;
}
try {
  run("provision:setStaff", { subject, active: true });
  run(
    "overview:summary",
    { days: 30, day: Math.floor((Date.now() + 8 * 3_600_000) / 86_400_000) },
    false,
    "UNAUTHORIZED",
  );
  run("overview:startBackfill", {});
  let baseline;
  for (let attempt = 0; attempt < 12; attempt++) {
    baseline = stats();
    if (baseline.ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(baseline.ready, true);
  jobId = run("jobs:save", { data }, true);
  run("jobs:setStatus", { id: jobId, status: "Published" }, true);
  const application = await submit("applications", {
    firstName: "Synthetic",
    lastName: "Admin test",
    email: "admin-test@example.invalid",
    phone: "09170000000",
    location: "Synthetic test location",
    position: data.title,
    jobId,
    privacyConsent: true,
    source: "development-admin-smoke",
  });
  const lead = await submit("businessLeads", {
    company: "Synthetic Admin Test Business",
    contactName: "Synthetic contact",
    email: "business-test@example.invalid",
    phone: "09170000000",
    companyWebsite: "",
    services: ["Customer Support"],
    message: "Synthetic development workflow test, removed after verification.",
    privacyConsent: true,
    source: "development-admin-smoke",
  });
  const saved = stats();
  assert.equal(total(saved.applications), total(baseline.applications) + 1);
  assert.equal(total(saved.leads), total(baseline.leads) + 1);
  run("admin:setPriority", { id: lead.id, priority: true }, true);
  run(
    "admin:update",
    {
      kind: "businessLeads",
      id: lead.id,
      status: "Contacted",
      notes: "Synthetic internal test note",
    },
    true,
  );
  assert.equal(stats().priorityLeads, baseline.priorityLeads + 1);
  assert.ok(
    run(
      "admin:list",
      {
        kind: "businessLeads",
        priorityOnly: true,
        status: "Contacted",
        paginationOpts: { cursor: null, numItems: 50 },
      },
      true,
    ).page.some((row) => row.id === lead.id),
  );
  run("jobs:setStatus", { id: jobId, status: "Archived" }, true);
  assert.equal(run("jobs:detail", { id: jobId }), null);
  run("jobs:remove", { id: jobId }, true, "JOB_HAS_APPLICATIONS");
  run("jobs:setStatus", { id: jobId, status: "Draft" }, true);
  assert.equal(run("jobs:staffDetail", { id: jobId }, true).status, "Draft");
  run(
    "admin:update",
    {
      kind: "applications",
      id: application.id,
      status: "Shortlisted",
      notes: "Synthetic review",
    },
    true,
  );
  console.log(
    "Development Convex verified: complete metrics, actual applicant/enquiry saves, priority filtering, review, archive/restore, and blocked linked-job deletion.",
  );
} finally {
  try {
    for (const record of records) run("admin:remove", record, true);
    if (jobId) run("jobs:remove", { id: jobId }, true);
  } finally {
    run("provision:setStaff", { subject, active: false });
  }
}
console.log(
  "Disposable records removed; temporary CLI staff approval revoked. Real Clerk sign-in and logout remain unverified.",
);
