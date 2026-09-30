import { describe, expect, it } from "vitest";
import { parseGoogleEnv, siteEnvSchema } from "@/lib/env-schema";

// Synthetic test fixture, not a usable credential.
const key = "-----BEGIN PRIVATE KEY-----\nTEST_ONLY\n-----END PRIVATE KEY-----";
const valid = {
  GOOGLE_SHEETS_SPREADSHEET_ID: "test-sheet",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "test@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: key,
};

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
  it("accepts actual and escaped key newlines", () => {
    expect(parseGoogleEnv(valid).GOOGLE_PRIVATE_KEY).toBe(key);
    expect(
      parseGoogleEnv({
        ...valid,
        GOOGLE_PRIVATE_KEY: key.replace(/\n/g, "\\n"),
      }).GOOGLE_PRIVATE_KEY,
    ).toBe(key);
  });
  it.each(Object.keys(valid))("requires %s at adapter access", (field) => {
    expect(() => parseGoogleEnv({ ...valid, [field]: "" })).toThrow(field);
  });
  it("rejects malformed configuration without exposing values", () => {
    expect(() =>
      parseGoogleEnv({ ...valid, GOOGLE_PRIVATE_KEY: "SECRET_INVALID_VALUE" }),
    ).toThrow("GOOGLE_PRIVATE_KEY");
    try {
      parseGoogleEnv({ ...valid, GOOGLE_PRIVATE_KEY: "SECRET_INVALID_VALUE" });
    } catch (error) {
      expect(String(error)).not.toContain("SECRET_INVALID_VALUE");
    }
  });
});
