import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { browserTestEnv } from "./browser-test-env.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = {
  ...process.env,
  ...browserTestEnv,
  PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT ?? "3100",
};
function run(relativeExecutable, args) {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL(relativeExecutable, new URL("../", import.meta.url)),
      ),
      ...args,
    ],
    { cwd: root, env, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// A fresh isolated build prevents NEXT_PUBLIC_* values from a real deployment
// leaking into fixtures. Neither this runner nor the suite deploys or seeds data.
run("node_modules/next/dist/bin/next", ["build", "--webpack"]);
run("node_modules/@playwright/test/cli.js", ["test", ...process.argv.slice(2)]);
