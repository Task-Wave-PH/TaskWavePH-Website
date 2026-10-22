import { withNotificationTarget } from "./notification-target.mjs";
import { requireDevelopmentTarget } from "./development-target.mjs";

requireDevelopmentTarget();
const deployment = "exuberant-lapwing-339";
if (
  process.env.CONVEX_DEPLOYMENT !== `dev:${deployment}` ||
  process.env.CONVEX_DEPLOY_KEY
)
  throw new Error(
    "Use the configured exuberant-lapwing-339 development deployment without a deploy-key override.",
  );

const values = {
  APPLICATION_NOTIFICATION_FROM:
    "TaskWavePH Recruitment <notifications@notify.taskwaveph.com>",
  APPLICATION_NOTIFICATION_TO: "franzhbataan@gmail.com",
  APPLICATION_NOTIFICATION_ADMIN_URL: "http://localhost:3000/admin",
  RESEND_TEST_MODE: "false",
  APPLICATION_NOTIFICATIONS_ENABLED: "true",
};
await withNotificationTarget("development", async (targetCli) => {
  const cli = (args) => targetCli(["env", ...args]);
  // Disable first and enable last, so partial setup does not start email processing.
  cli(["set", "APPLICATION_NOTIFICATIONS_ENABLED", "false"]);
  for (const [name, value] of Object.entries(values)) {
    if (name === "APPLICATION_NOTIFICATIONS_ENABLED") continue;
    cli(["set", name, value]);
    console.log(`${name}: configured on ${deployment}.`);
  }
  for (const [name, value] of Object.entries(values)) {
    if (name === "APPLICATION_NOTIFICATIONS_ENABLED") continue;
    if (cli(["get", name]) !== value)
      throw new Error(`Verification failed for ${name}.`);
  }
  cli(["set", "APPLICATION_NOTIFICATIONS_ENABLED", "true"]);
  if (cli(["get", "APPLICATION_NOTIFICATIONS_ENABLED"]) !== "true")
    throw new Error("Notification enablement verification failed.");
  console.log(
    "Non-secret settings verified. Add RESEND_API_KEY manually in this development deployment. This script does not send email or configure production.",
  );
});
