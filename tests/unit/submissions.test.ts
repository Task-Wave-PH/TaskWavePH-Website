import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateResume,
  MAX_RESUME_BYTES,
} from "../../features/submissions/validation";
import { leadSchema } from "../../features/leads/schema";
import { isAdminHostname, isLocalHostname } from "../../lib/admin-host";
vi.mock("server-only", () => ({}));
import { submissionsEnabled, getSubmissionEnv } from "../../lib/submission-env";
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
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
}
function stubBackendFetch(backend: typeof fetch) {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    String(input).endsWith("/submission-attempt")
      ? Promise.resolve(Response.json({ allowed: true, retryAfterSeconds: 0 }))
      : backend(input, init),
  );
}
describe("submission protections", () => {
  it.each([
    "1x0000000000000000000000000000000AA",
    "2x0000000000000000000000000000000AA",
    "3x0000000000000000000000000000000AA",
  ])("rejects dummy secret %s in production", (secret) => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", secret);
    expect(() => getSubmissionEnv()).toThrow("test key");
  });
  it.each([
    "1x00000000000000000000AA",
    "2x00000000000000000000AB",
    "1x00000000000000000000BB",
    "2x00000000000000000000BB",
    "3x00000000000000000000FF",
  ])("rejects dummy browser key %s in production", (key) => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", key);
    expect(() => getSubmissionEnv()).toThrow("test key");
  });
  it("requires a browser challenge key when submissions are configured", () => {
    configure();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    expect(() => getSubmissionEnv()).toThrow("configuration is incomplete");
  });
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
    stubBackendFetch(fetch);
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
    stubBackendFetch(fetch);
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
    stubBackendFetch(
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
    stubBackendFetch(
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

describe("early submission limits and error propagation", () => {
  it("rejects unsupported content without contacting the backend", async () => {
    configure();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await submitRequest(
      new Request("http://localhost/api/applications", {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      }),
      "applications",
    );
    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("throttles before reading a body or verifying a challenge", async () => {
    configure();
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: "RATE_LIMITED", retryAfterSeconds: 120 },
          { status: 429 },
        ),
      );
    vi.stubGlobal("fetch", fetch);
    const body = vi.spyOn(Request.prototype, "formData");
    const response = await submitRequest(request(), "applications");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(await response.json()).toMatchObject({ retryAfterSeconds: 120 });
    expect(body).not.toHaveBeenCalled();
    body.mockRestore();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("preserves closed-role recovery and save-limit cooldowns", async () => {
    configure();
    for (const [error, status] of [
      ["JOB_UNAVAILABLE", 409],
      ["RATE_LIMITED", 429],
    ] as const) {
      stubBackendFetch(
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
            Response.json(
              { error, ...(status === 429 ? { retryAfterSeconds: 45 } : {}) },
              { status },
            ),
          ),
      );
      const response = await submitRequest(request(), "applications");
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ success: false, error });
      expect(response.headers.get("set-cookie")).toBeNull();
      if (status === 429)
        expect(response.headers.get("Retry-After")).toBe("45");
    }
  });
});
