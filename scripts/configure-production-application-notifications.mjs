import { withNotificationTarget } from "./notification-target.mjs";

// Deliberately separate from development setup. Never enable sending or replace keys.
const deployment = "fabulous-crane-816";
const values = {
  APPLICATION_NOTIFICATIONS_ENABLED: "false",
  APPLICATION_NOTIFICATION_FROM:
    "TaskWavePH Recruitment <notifications@notify.taskwaveph.com>",
  APPLICATION_NOTIFICATION_TO: "franzhbataan@gmail.com",
  APPLICATION_NOTIFICATION_ADMIN_URL: "https://admin.taskwaveph.com",
  RESEND_TEST_MODE: "false",
};
await withNotificationTarget("production", async (targetCli) => {
  const cli = (args) => targetCli(["env", ...args]);
  for (const [name, value] of Object.entries(values)) {
    cli(["set", name, value]);
    if (cli(["get", name]) !== value)
      throw new Error(`Verification failed for ${name}.`);
    console.log(`${name}: verified on ${deployment}.`);
  }
  for (const name of ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"]) {
    // Inspect presence only; never print credentials or copy development secrets.
    const present = !!cli(["get", name]);
    console.log(
      `${name}: ${present ? "present" : "needs manual configuration"}.`,
    );
  }
  console.log(
    "Production settings verified. Sending remains disabled pending sender/webhook verification. No email sent.",
  );
});
