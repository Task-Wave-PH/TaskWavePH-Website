import { spawnSync } from "node:child_process";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const cleanup = process.argv.includes("--cleanup");
let result = spawnSync(
  "npx",
  ["convex", "env", "set", "ALLOW_DEVELOPMENT_SEED", "true"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
if (result.status !== 0)
  throw new Error("Could not enable seeding on the development backend.");
try {
  result = spawnSync(
    "npx",
    ["convex", "run", cleanup ? "seed:cleanup" : "seed:run", "{}"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0)
    throw new Error(
      "Development seed operation failed. Check the Convex development logs.",
    );
  console.log(result.stdout.trim());
} finally {
  spawnSync(
    "npx",
    ["convex", "env", "set", "ALLOW_DEVELOPMENT_SEED", "false"],
    { stdio: "ignore" },
  );
}
