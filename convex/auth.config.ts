import type { AuthConfig } from "convex/server";
// No auth provider means admin access fails closed until Clerk is configured.
export default {
  providers: process.env.CLERK_JWT_ISSUER_DOMAIN
    ? [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }]
    : [],
} satisfies AuthConfig;
