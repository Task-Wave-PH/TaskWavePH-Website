import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
function cli(args) {
  const result = spawnSync("npx", ["convex", ...args], {
    encoding: "utf8",
    timeout: 30000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result;
}
function run(name, args, subject, denied) {
  const result = cli([
    "run",
    name,
    JSON.stringify(args),
    ...(subject
      ? [
          "--identity",
          JSON.stringify({
            subject,
            issuer: "https://clerk-development-not-configured.invalid",
          }),
        ]
      : []),
  ]);
  if (denied) {
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(denied));
    return;
  }
  if (result.status !== 0)
    throw new Error(`Development verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
// Refuse temporary Owner provisioning unless another active Owner remains for cleanup.
const usersResult = cli([
  "data",
  "adminUsers",
  "--format",
  "json",
  "--limit",
  "100",
]);
assert.equal(
  usersResult.status,
  0,
  "Unable to verify development Owner availability.",
);
const users = JSON.parse(usersResult.stdout);
assert.ok(
  users.some((u) => u.active && u.role === "Owner"),
  "An existing active development Owner is required.",
);
const owner = `user_qr_settings_owner_${randomUUID()}`;
const staff = `user_qr_settings_staff_${randomUUID()}`;
let ownerCreated = false;
let staffCreated = false;
try {
  run("provision:setStaff", { subject: owner, active: true, role: "Owner" });
  ownerCreated = true;
  run("provision:setStaff", { subject: staff, active: true, role: "Staff" });
  staffCreated = true;
  run("settings:read", {}, undefined, "UNAUTHORIZED");
  const original = run("settings:read", {}, owner);
  run(
    "settings:save",
    { value: original.value, expectedRevision: original.revision },
    staff,
    "OWNER_REQUIRED",
  );
  const saved = run(
    "settings:save",
    { value: original.value, expectedRevision: original.revision },
    owner,
  );
  assert.equal(saved.saved, true);
  const current = run("settings:read", {}, staff);
  assert.deepEqual(current.value, original.value);
  assert.equal(current.revision, original.revision + 1);
  if (process.argv.includes("--upload-logo")) {
    assert.notEqual(
      original.value.logo,
      "custom",
      "Keep an existing custom logo unchanged; use a manual upload check instead.",
    );
    const canvas = createCanvas(32, 32);
    const context = canvas.getContext("2d");
    context.fillStyle = "#0A1D3B";
    context.fillRect(0, 0, 32, 32);
    const png = { $bytes: canvas.toBuffer("image/png").toString("base64") };
    const args = {
      value: { ...original.value, logo: "custom" },
      expectedRevision: current.revision,
      png,
    };
    run("qrLogos:save", args, staff, "OWNER_REQUIRED");
    let upload;
    try {
      upload = run("qrLogos:save", args, owner);
      assert.equal(upload.saved, true);
      const records = cli([
        "data",
        "ownerSettings",
        "--format",
        "json",
        "--limit",
        "2",
      ]);
      assert.equal(records.status, 0);
      const storageId = JSON.parse(records.stdout).find(
        (row) => row.key === "qr",
      )?.logoStorageId;
      assert.ok(storageId);
      assert.equal(run("settings:read", {}, staff).value.logo, "custom");
      const anonymous = await fetch(`${process.env.CONVEX_SITE_URL}/qr-logo`);
      assert.equal(anonymous.status, 401);
      assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
      console.log(
        "Development PNG upload: confirmed stored logo, Staff settings read, Owner-only write, and anonymous HTTP denial. Private browser image reads need real Clerk verification.",
      );
    } finally {
      if (upload?.saved)
        run(
          "settings:save",
          { value: original.value, expectedRevision: upload.revision },
          owner,
        );
    }
    assert.deepEqual(run("settings:read", {}, owner).value, original.value);
  }
  run(
    "settings:save",
    { value: original.value, expectedRevision: original.revision },
    owner,
    "STALE_SETTINGS",
  );
  run(
    "settings:save",
    {
      value: { ...original.value, color: "#FFFFFF" },
      expectedRevision: current.revision,
    },
    owner,
    "INVALID_SETTINGS",
  );
  const activity = run(
    "admin:activity",
    { paginationOpts: { cursor: null, numItems: 50 } },
    owner,
  );
  assert.ok(activity.page.some((row) => row.action === "qr_settings_updated"));
  console.log(
    "Development QR settings: confirmed save/read, unchanged design values, stale and unsafe-color rejection, Staff save denial, and activity recording.",
  );
} finally {
  if (staffCreated)
    run("provision:setStaff", { subject: staff, active: false });
  if (ownerCreated)
    run("provision:setStaff", { subject: owner, active: false });
}
console.log(
  "Temporary development approvals deactivated. Metadata-only audit history retained. CLI identities are not real Clerk browser sign-in.",
);
