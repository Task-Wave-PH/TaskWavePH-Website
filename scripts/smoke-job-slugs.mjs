import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_job_slugs_${randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, authenticated = false) {
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
  if (result.status !== 0)
    throw new Error(`Development slug verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
const data = {
  title: `Synthetic URL Check ${randomUUID()}`,
  serviceArea: "Customer Support",
  location: "Synthetic test only",
  arrangement: "Remote",
  employmentType: "Contract",
  description: "Synthetic development verification, not an actual vacancy.",
  responsibilities: "Synthetic verification responsibilities.",
  requirements: "Synthetic verification requirements.",
  salary: "",
};
const created = new Set();
let provisioned = false;
try {
  run("provision:setStaff", { subject, active: true });
  provisioned = true;
  for (let index = 0; index < 2; index++)
    created.add(run("jobs:save", { data }, true));
  const [a, b] = [...created];
  assert.equal(run("jobs:detail", { id: a }), null);
  for (const id of created)
    run("jobs:setStatus", { id, status: "Published" }, true);
  const first = run("jobs:detail", { id: a });
  const second = run("jobs:detail", { id: b });
  assert.ok(first.slug.endsWith("-01"));
  assert.ok(second.slug.endsWith("-02"));
  assert.equal(run("jobs:detail", { id: first.slug })._id, a);
  run(
    "jobs:save",
    {
      id: a,
      data: { ...data, title: "Synthetic renamed role" },
      expectedUpdatedAt: first.updatedAt,
    },
    true,
  );
  run("jobs:setStatus", { id: a, status: "Closed" }, true);
  assert.equal(run("jobs:detail", { id: first.slug }), null);
  run("jobs:setStatus", { id: a, status: "Published" }, true);
  assert.equal(run("jobs:detail", { id: a }).slug, first.slug);
  run("jobs:remove", { id: b }, true);
  created.delete(b);
  const c = run("jobs:save", { data }, true);
  created.add(c);
  run("jobs:setStatus", { id: c, status: "Published" }, true);
  assert.ok(run("jobs:detail", { id: c }).slug.endsWith("-03"));
  assert.equal(run("jobs:detail", { id: second.slug }), null);
  const neverPublished = run("jobs:save", { data }, true);
  created.add(neverPublished);
  run("jobs:setStatus", { id: neverPublished, status: "Archived" }, true);
  run("jobSlugs:backfill", { cursor: null });
  assert.equal(
    run("jobs:staffDetail", { id: neverPublished }, true).slug,
    undefined,
  );
  run("jobs:setStatus", { id: neverPublished, status: "Draft" }, true);
  run("jobs:setStatus", { id: neverPublished, status: "Published" }, true);
  assert.ok(run("jobs:detail", { id: neverPublished }).slug);
  console.log(
    "Development job slug writes, indexed reads, closure, stable edits, and non-reuse passed.",
  );
} finally {
  for (const id of created) run("jobs:remove", { id }, true);
  if (provisioned) run("provision:setStaff", { subject, active: false });
  console.log(
    "Synthetic jobs deleted; temporary staff deactivated. Sequence/audit metadata retained.",
  );
}
