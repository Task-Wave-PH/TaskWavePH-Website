import { spawnSync } from "node:child_process";
process.loadEnvFile(".env.local");
if (
  !process.env.CONVEX_DEPLOYMENT ||
  process.env.CONVEX_DEPLOYMENT.startsWith("prod:")
)
  throw new Error("Use a development deployment only.");
if (!process.env.STAFF_INVITATION_REDIRECT_URL) {
  const admin = new URL(
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3000/admin",
  );
  admin.pathname = `${admin.pathname.replace(/\/$/, "")}/sign-up`;
  process.env.STAFF_INVITATION_REDIRECT_URL = admin.toString();
}
for (const name of [
  "CONVEX_SERVER_SECRET",
  "CLERK_JWT_ISSUER_DOMAIN",
  "CLERK_SECRET_KEY",
  "STAFF_INVITATION_REDIRECT_URL",
]) {
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
