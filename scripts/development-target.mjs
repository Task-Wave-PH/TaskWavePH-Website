import { existsSync } from "node:fs";

export function requireDevelopmentTarget() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const deployment = process.env.CONVEX_DEPLOYMENT ?? "";
  const site = new URL(process.env.CONVEX_SITE_URL ?? "http://invalid");
  const client = new URL(
    process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://invalid",
  );
  const local = [site, client].every((url) =>
    ["127.0.0.1", "localhost"].includes(url.hostname),
  );
  const name = deployment.startsWith("dev:") ? deployment.slice(4) : "";
  const remote =
    name &&
    site.hostname === `${name}.convex.site` &&
    client.hostname === `${name}.convex.cloud` &&
    site.protocol === "https:" &&
    client.protocol === "https:";
  if (!(local && /^(anonymous|local|dev):/.test(deployment)) && !remote)
    throw new Error(
      "Submission tests require matching development Convex targets.",
    );
}
