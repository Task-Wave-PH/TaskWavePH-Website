import assert from "node:assert/strict";
import { withNotificationTarget } from "./notification-target.mjs";
import { createHash, randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
if (process.env.CONVEX_DEPLOYMENT !== "dev:exuberant-lapwing-339")
  throw new Error(
    "Notification checks require exuberant-lapwing-339 development.",
  );
await withNotificationTarget("development", async (cli) => {
  if (cli(["env", "get", "APPLICATION_NOTIFICATIONS_ENABLED"]) === "true")
    throw new Error(
      "Verification requires development notifications disabled; no email will be sent.",
    );
  const unique = randomUUID();
  const subject = `user_notification_check_${unique}`;
  const identity = JSON.stringify({
    subject,
    issuer: "https://clerk-development-not-configured.invalid",
  });
  function run(name, args, staff = false) {
    const output = cli([
      "run",
      name,
      JSON.stringify(args),
      ...(staff ? ["--identity", identity] : []),
    ]);
    return output ? JSON.parse(output) : null;
  }
  const email = `notification-${unique}@example.invalid`;
  const token = randomUUID();
  const fields = {
    firstName: "Synthetic",
    lastName: "Notification",
    email,
    phone: "09171234567",
    location: "Synthetic test only",
    position: "Synthetic notification test",
    privacyConsent: true,
  };
  async function submit() {
    const body = new FormData();
    body.set("kind", "applications");
    body.set("submissionToken", token);
    body.set("fields", JSON.stringify(fields));
    const result = await fetch(`${process.env.CONVEX_SITE_URL}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
        "x-rate-key": createHash("sha256").update(unique).digest("hex"),
      },
      body,
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(result.status, 200);
    return await result.json();
  }
  function records() {
    return run(
      "admin:list",
      {
        kind: "applications",
        filters: { search: email },
        paginationOpts: { numItems: 10, cursor: null },
      },
      true,
    ).page;
  }
  let provisioned = false;
  try {
    run("provision:setStaff", { subject, active: true });
    provisioned = true;
    const first = await submit();
    assert.equal(first.success, true);
    const retry = await submit();
    assert.equal(retry.reference, first.reference);
    const saved = records();
    assert.equal(saved.length, 1);
    const detail = run(
      "admin:detail",
      { kind: "applications", id: saved[0].id },
      true,
    );
    assert.equal(detail.notificationBatchId, undefined);
    assert.equal(
      run("applicationNotifications:enqueue", { applicationId: saved[0].id }),
      null,
    );
    const webhook = await fetch(
      `${process.env.CONVEX_SITE_URL}/resend-webhook`,
      {
        method: "POST",
        body: "{}",
        signal: AbortSignal.timeout(10000),
      },
    );
    assert.ok([400, 503].includes(webhook.status));
    console.log(
      "Development save, identical retry, disabled notification function, and unsigned webhook checks passed. No email sent.",
    );
  } finally {
    if (provisioned) {
      try {
        for (const row of records())
          run("admin:remove", { kind: "applications", id: row.id }, true);
      } finally {
        run("provision:setStaff", { subject, active: false });
      }
    }
    console.log(
      "Disposable applications removed; synthetic staff deactivated. Audit metadata retained.",
    );
  }
});
