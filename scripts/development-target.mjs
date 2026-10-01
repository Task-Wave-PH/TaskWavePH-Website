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
  const cloudSuffix = client.hostname.slice(name.length);
  const matchingCloudHost =
    client.hostname.startsWith(`${name}.`) &&
    /^\.(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)?convex\.cloud$/.test(cloudSuffix);
  const remote =
    name &&
    matchingCloudHost &&
    site.hostname === client.hostname.replace(/\.cloud$/, ".site") &&
    site.protocol === "https:" &&
    client.protocol === "https:";
  if (!(local && /^(anonymous|local|dev):/.test(deployment)) && !remote)
    throw new Error(
      "Submission tests require matching development Convex targets.",
    );
}
