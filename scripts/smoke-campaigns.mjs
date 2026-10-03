import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_campaign_test_${randomUUID()}`;
const campaign = `synthetic-${randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, staff = false, expectedFailure) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(staff ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (expectedFailure) {
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(expectedFailure));
    return;
  }
  if (result.status !== 0)
    throw new Error(`Development campaign verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
let jobId;
const ids = [];
try {
  run("provision:setStaff", { subject, active: true });
  run(
    "exports:page",
    { filters: { campaign }, paginationOpts: { cursor: null, numItems: 100 } },
    false,
    "UNAUTHORIZED",
  );
  jobId = run(
    "jobs:save",
    {
      data: {
        title: "Synthetic campaign check — not a vacancy",
        serviceArea: "Customer Support",
        location: "Synthetic location",
        arrangement: "Remote",
        employmentType: "Contract",
        description:
          "Synthetic development campaign workflow. This is not a real vacancy and is deleted after verification.",
        responsibilities: "Synthetic testing only.",
        requirements: "Synthetic testing only.",
        salary: "",
      },
    },
    true,
  );
  run("jobs:setStatus", { id: jobId, status: "Published" }, true);
  for (const source of ["linkedin", "facebook"]) {
    const token = randomUUID();
    const body = new FormData();
    body.set("kind", "applications");
    body.set("submissionToken", token);
    body.set(
      "fields",
      JSON.stringify({
        firstName: "Synthetic",
        lastName: "Campaign check",
        email: "campaign-test@example.invalid",
        phone: "09170000000",
        location: "Synthetic",
        position: "Synthetic",
        jobId,
        privacyConsent: true,
        source,
        campaign,
        utm_source: source,
        utm_medium: "social",
        utm_campaign: campaign,
      }),
    );
    const response = await fetch(`${process.env.CONVEX_SITE_URL}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
        "x-rate-key": createHash("sha256").update(token).digest("hex"),
      },
      body,
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200);
    const row = run(
      "admin:list",
      {
        kind: "applications",
        filters: { campaign, source },
        paginationOpts: { cursor: null, numItems: 20 },
      },
      true,
    ).page[0];
    assert.ok(row);
    ids.push(row.id);
    assert.equal(row.source, source);
    assert.equal(row.campaign, campaign);
  }
  const filters = { campaign, jobId, source: "linkedin" };
  const listed = run(
    "admin:list",
    {
      kind: "applications",
      filters,
      paginationOpts: { cursor: null, numItems: 20 },
    },
    true,
  );
  assert.equal(listed.page.length, 1);
  const exported = run(
    "exports:page",
    { filters, paginationOpts: { cursor: null, numItems: 100 } },
    true,
  );
  assert.equal(exported.page.length, 1);
  assert.equal(exported.page[0]._id, listed.page[0].id);
  assert.equal(exported.page[0].data.utm_source, "linkedin");
  run(
    "admin:update",
    {
      kind: "applications",
      id: listed.page[0].id,
      status: "Shortlisted",
      notes: "",
      expected: { status: "New", notes: "" },
    },
    true,
  );
  assert.equal(
    run(
      "exports:page",
      {
        status: "Shortlisted",
        filters,
        paginationOpts: { cursor: null, numItems: 100 },
      },
      true,
    ).page.length,
    1,
  );
  assert.equal(
    run(
      "exports:page",
      {
        status: "Reviewed",
        filters,
        paginationOpts: { cursor: null, numItems: 100 },
      },
      true,
    ).page.length,
    0,
  );
  run("exports:audit", { format: "pdf", count: exported.page.length }, true);
  console.log(
    "Development campaign workflow verified: real saves, channel/campaign/job filtering, matching protected export, current status filtering, and denied anonymous access.",
  );
} finally {
  try {
    for (const id of ids)
      run("admin:remove", { kind: "applications", id }, true);
    if (jobId) run("jobs:remove", { id: jobId }, true);
  } finally {
    run("provision:setStaff", { subject, active: false });
  }
}
console.log(
  "Disposable records removed and CLI test approval revoked. This does not verify real Clerk browser sign-in.",
);
