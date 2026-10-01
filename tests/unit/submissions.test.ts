import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateResume,
  MAX_RESUME_BYTES,
} from "../../features/submissions/validation";
import { leadSchema } from "../../features/leads/schema";
import { isAdminHostname, isLocalHostname } from "../../lib/admin-host";
vi.mock("server-only", () => ({}));
import { submissionsEnabled } from "../../lib/submission-env";
import { submitRequest } from "../../features/submissions/service";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const fields = {
  firstName: "Maria",
  lastName: "Santos",
  email: "maria@example.com",
  phone: "09171234567",
  location: "Cebu",
  position: "Support",
  privacyConsent: true,
};
function request(data: object = fields, file?: Blob) {
  const form = new FormData();
  form.set("fields", JSON.stringify(data));
  form.set("submissionToken", crypto.randomUUID());
  form.set("turnstileToken", "challenge");
  if (file) form.set("resumeFile", file, "resume.pdf");
  return new Request("http://localhost:3000/api/applications", {
    method: "POST",
    body: form,
  });
}
function configure() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SUBMISSIONS_ENABLED", "true");
  vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");
  vi.stubEnv("CONVEX_SERVER_SECRET", "x".repeat(64));
  vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
}
describe("submission protections", () => {
  it("enables the development flag only on the development server", () => {
    vi.stubEnv("SUBMISSIONS_ENABLED", "development");
    vi.stubEnv("NODE_ENV", "development");
    expect(submissionsEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(submissionsEnabled()).toBe(false);
    vi.stubEnv("NODE_ENV", "test");
    expect(submissionsEnabled()).toBe(false);
  });
  it("accepts a PDF and rejects empty, disguised and oversized files", async () => {
    await validateResume(new Blob(["%PDF-1.7"], { type: "application/pdf" }));
    for (const blob of [
      new Blob([], { type: "application/pdf" }),
      new Blob(["bad"], { type: "application/pdf" }),
      new Blob(["%PDF-"], { type: "text/plain" }),
      new Blob([new Uint8Array(MAX_RESUME_BYTES + 1)], {
        type: "application/pdf",
      }),
    ])
      await expect(validateResume(blob)).rejects.toThrow();
  });
  it("validates business purpose, service choices and consent", () => {
    const lead = {
      company: "Example",
      contactName: "Jane Doe",
      email: "jane@example.com",
      services: ["Customer Support"],
      message: "We need help with customer service",
      privacyConsent: true,
    };
    expect(leadSchema.safeParse(lead).success).toBe(true);
    for (const patch of [
      { services: [] },
      { services: ["fake"] },
      { privacyConsent: false },
      { message: "tiny" },
    ])
      expect(leadSchema.safeParse({ ...lead, ...patch }).success).toBe(false);
  });
  it("recognizes only the configured admin host", () => {
    expect(
      isAdminHostname("admin.taskwaveph.com", "https://admin.taskwaveph.com"),
    ).toBe(true);
    expect(
      isAdminHostname(
        "admin.taskwaveph.com.evil.test",
        "https://admin.taskwaveph.com",
      ),
    ).toBe(false);
    expect(isLocalHostname("localhost")).toBe(true);
  });
  it("fails closed when submissions are disabled", async () => {
    vi.stubEnv("SUBMISSIONS_ENABLED", "false");
    expect((await submitRequest(request(), "applications")).status).toBe(503);
  });
  it("blocks production without an approved privacy policy", async () => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PRIVACY_POLICY_APPROVED", "false");
    expect((await submitRequest(request(), "applications")).status).toBe(503);
  });
  it("does not call Convex for bad consent or a failed challenge", async () => {
    configure();
    const fetch = vi.fn().mockResolvedValue(Response.json({ success: false }));
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await submitRequest(
          request({ ...fields, privacyConsent: false }),
          "applications",
        )
      ).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect((await submitRequest(request(), "applications")).status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("saves only after verified challenge and confirmed backend success", async () => {
    configure();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          action: "submission",
          hostname: "localhost",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ success: true, reference: "TW-A-test" }),
      );
    vi.stubGlobal("fetch", fetch);
    const response = await submitRequest(request(), "applications");
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("tw-application-receipt=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/apply/success");
    expect(cookie).toContain("Max-Age=600");
    expect(await response.json()).toEqual({
      success: true,
      applicationId: "TW-A-test",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("returns a safe failure when storage/backend fails", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            success: true,
            action: "submission",
            hostname: "localhost",
          }),
        )
        .mockResolvedValueOnce(
          Response.json({ error: "internal-secret-detail" }, { status: 500 }),
        ),
    );
    const response = await submitRequest(request(), "applications");
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("internal-secret-detail");
  });
  it("rejects wrong challenge hostname and oversized request before persistence", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          success: true,
          action: "submission",
          hostname: "evil.test",
        }),
      ),
    );
    expect((await submitRequest(request(), "applications")).status).toBe(400);
    expect(
      (
        await submitRequest(
          request(fields, new Blob([new Uint8Array(3 * 1024 * 1024)])),
          "applications",
        )
      ).status,
    ).toBe(413);
  });
});
