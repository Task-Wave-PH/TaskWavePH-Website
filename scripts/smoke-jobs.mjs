import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_taskwaveph_jobs_test_${crypto.randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, staff = false, denied = false) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(staff ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (denied) {
    assert.notEqual(result.status, 0);
    return null;
  }
  if (result.status !== 0)
    throw Error(`Development job verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
const data = {
  title: "Synthetic Development Draft - Not a Vacancy",
  serviceArea: "Customer Support",
  location: "Synthetic test location",
  arrangement: "Remote",
  employmentType: "Contract",
  description:
    "Synthetic draft used only to verify development job storage. Not an actual vacancy.",
  responsibilities: "Synthetic workflow verification only.",
  requirements: "Synthetic workflow verification only.",
  salary: "",
};
let id;
try {
  run("provision:setStaff", { subject, active: true });
  id = run("jobs:save", { data }, true);
  assert.equal(run("jobs:staffDetail", { id }, true).status, "Draft");
  assert.equal(run("jobs:detail", { id }), null);
  run(
    "jobs:save",
    {
      id,
      data: { ...data, description: data.description + " Updated draft." },
    },
    true,
  );
  assert.ok(
    run("jobs:staffDetail", { id }, true).description.endsWith(
      "Updated draft.",
    ),
  );
  run(
    "jobs:staffList",
    { paginationOpts: { numItems: 20, cursor: null } },
    false,
    true,
  );
  run("jobs:setStatus", { id, status: "Published" }, false, true);
  run("jobs:setStatus", { id, status: "Closed" }, true);
  assert.equal(run("jobs:detail", { id }), null);
  console.log(
    "Development jobs verified: draft creation/read/update/closure, public hiding, and denied anonymous publishing. No vacancy was published.",
  );
} finally {
  if (id) run("jobs:setStatus", { id, status: "Closed" }, true);
  run("provision:setStaff", { subject, active: false });
}
run(
  "jobs:staffList",
  { paginationOpts: { numItems: 20, cursor: null } },
  true,
  true,
);
console.log(
  "Temporary CLI staff approval revoked. Synthetic closed posting retained for audit; real Clerk sign-in remains unverified.",
);
