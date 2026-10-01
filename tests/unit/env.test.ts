import { describe, expect, it } from "vitest";
import { siteEnvSchema, submissionEnvSchema } from "@/lib/env-schema";

describe("environment validation", () => {
  it("defaults the site URL locally and accepts HTTPS", () => {
    expect(siteEnvSchema.parse({}).NEXT_PUBLIC_SITE_URL).toBe(
      "http://localhost:3000",
    );
    expect(
      siteEnvSchema.parse({ NEXT_PUBLIC_SITE_URL: "https://taskwaveph.com" })
        .NEXT_PUBLIC_SITE_URL,
    ).toBe("https://taskwaveph.com");
  });
  it.each(["invalid", "", "file:///tmp/site"])(
    "rejects invalid site URL %s",
    (url) => {
      expect(
        siteEnvSchema.safeParse({ NEXT_PUBLIC_SITE_URL: url }).success,
      ).toBe(false);
    },
  );
  it("requires the Convex HTTP URL, a strong shared secret, and a challenge secret", () => {
    const valid = {
      CONVEX_SITE_URL: "https://development.convex.site",
      CONVEX_SERVER_SECRET: "x".repeat(64),
      TURNSTILE_SECRET_KEY: "synthetic-test-key",
    };
    expect(submissionEnvSchema.safeParse(valid).success).toBe(true);
    for (const key of Object.keys(valid))
      expect(
        submissionEnvSchema.safeParse({ ...valid, [key]: "" }).success,
      ).toBe(false);
    expect(
      submissionEnvSchema.safeParse({
        ...valid,
        CONVEX_SITE_URL: "file:///tmp/backend",
      }).success,
    ).toBe(false);
    expect(
      submissionEnvSchema.safeParse({ ...valid, CONVEX_SERVER_SECRET: "short" })
        .success,
    ).toBe(false);
  });
});
