import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Convex deployment keys override --deployment-name. An explicit, non-secret
// env file isolates both target selection and CLI auth from workspace overrides.
/**
 * @template T
 * @param {"development" | "production"} kind
 * @param {(cli: (args: string[]) => string, deployment: string) => T | Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withNotificationTarget(kind, operation) {
  const deployment = {
    development: "exuberant-lapwing-339",
    production: "fabulous-crane-816",
  }[kind];
  if (!deployment) throw new Error("Unknown notification deployment.");
  const directory = mkdtempSync(
    join(tmpdir(), "taskwave-notification-target-"),
  );
  try {
    const file = join(directory, "target.env");
    writeFileSync(
      file,
      `CONVEX_DEPLOYMENT=${kind === "production" ? "prod" : "dev"}:${deployment}\n`,
      { mode: 0o600 },
    );
    const cliEnv = { ...process.env };
    for (const name of [
      "CONVEX_DEPLOY_KEY",
      "CONVEX_DEPLOYMENT_TOKEN",
      "CONVEX_SELF_HOSTED_URL",
      "CONVEX_SELF_HOSTED_ADMIN_KEY",
    ])
      delete cliEnv[name];
    function cli(args) {
      const result = spawnSync(
        "npx",
        [
          "convex",
          ...args,
          "--env-file",
          file,
          "--deployment-name",
          deployment,
        ],
        {
          env: cliEnv,
          encoding: "utf8",
          timeout: 30000,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      if (result.status !== 0)
        throw new Error(
          "Notification command failed; check Convex CLI access. No credentials are printed.",
        );
      return result.stdout.trim();
    }
    return await operation(cli, deployment);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
