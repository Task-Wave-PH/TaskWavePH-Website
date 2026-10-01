import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getPrivacyInformation } from "../../lib/privacy";
afterEach(() => vi.unstubAllEnvs());
function configured() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SUBMISSIONS_ENABLED", "false");
  vi.stubEnv("PRIVACY_POLICY_APPROVED", "true");
  vi.stubEnv("PRIVACY_ORGANIZATION", "Example Organization");
  vi.stubEnv("PRIVACY_CONTACT_EMAIL", "privacy@example.invalid");
  vi.stubEnv(
    "PRIVACY_RETENTION_NOTICE",
    "A reviewed retention statement for testing.",
  );
}
describe("public privacy policy configuration", () => {
  it("requires complete approved production configuration before showing published status", () => {
    configured();
    expect(getPrivacyInformation().status).toBe("Published privacy policy");
    vi.stubEnv("PRIVACY_CONTACT_EMAIL", "not-an-email");
    expect(getPrivacyInformation().status).toBe("Development draft");
    expect(getPrivacyInformation().contact).toBeUndefined();
    configured();
    vi.stubEnv("PRIVACY_POLICY_APPROVED", "false");
    expect(getPrivacyInformation().status).toBe("Development draft");
  });
  it("retains draft status in development and never invents a contact or retention period", () => {
    configured();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUBMISSIONS_ENABLED", "development");
    vi.stubEnv("PRIVACY_CONTACT_EMAIL", "");
    vi.stubEnv("PRIVACY_RETENTION_NOTICE", "");
    const result = getPrivacyInformation();
    expect(result.status).toBe("Development draft");
    expect(result.notice).toContain("Use test information only");
    expect(result.contact).toBeUndefined();
    expect(result.retention).toBeUndefined();
    expect(result.organization).toBe("Example Organization");
  });
});
