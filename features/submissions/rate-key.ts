import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export function submissionRateKey(request: Request, secret: string) {
  // Only Vercel's deployment-injected header is trusted. Direct/self-hosted
  // requests share a fallback bucket rather than trusting caller-supplied IPs.
  const forwarded =
    process.env.VERCEL === "1"
      ? request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      : undefined;
  const address = forwarded && isIP(forwarded) ? forwarded : "unknown";
  return createHmac("sha256", secret)
    .update(`submission-address:v1:${address}`)
    .digest("hex");
}
