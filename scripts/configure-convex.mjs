import { spawnSync } from "node:child_process";
process.loadEnvFile(".env.local");
if (
  !process.env.CONVEX_DEPLOYMENT ||
  process.env.CONVEX_DEPLOYMENT.startsWith("prod:")
)
  throw new Error("Use a development deployment only.");
for (const name of ["CONVEX_SERVER_SECRET", "CLERK_JWT_ISSUER_DOMAIN"]) {
  const value = process.env[name];
  if (!value) {
    console.log(
      `${name}: not configured; admin authentication remains unavailable until Clerk is set up.`,
    );
    continue;
  }
  const result = spawnSync("npx", ["convex", "env", "set", name, value], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `Failed to configure ${name}; check your local Convex backend.`,
    );
  console.log(`${name}: configured on development deployment.`);
}
