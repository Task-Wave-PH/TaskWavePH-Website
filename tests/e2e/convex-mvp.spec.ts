import { test, expect } from "@playwright/test";
test("local UI previews are unavailable in production", async ({ request }) => {
  for (const page of [
    "",
    "businessLeads/sample-lead-002",
    "login",
    "applications",
    "businessLeads",
    "applications/sample-001",
    "sample-cv",
    "jobs",
    "jobs/new",
    "careers",
    "careers/sample-job-001",
    "job-apply?jobId=sample-job-001",
  ]) {
    expect((await request.get(`/dev-preview/${page}`)).status()).toBe(404);
  }
});
test("business enquiry preview validates required data without saving", async ({
  page,
}) => {
  await page.goto("/business-enquiry?source=cite");
  await expect(page.getByText(/Enquiries are not open yet/)).toBeVisible();
  await page.getByRole("button", { name: "Validate Enquiry" }).click();
  await expect(page.getByLabel("Company", { exact: true })).toBeFocused();
  await page.getByLabel("Company", { exact: true }).fill("Example company");
  await page.getByLabel("Contact Name", { exact: true }).fill("Jane Doe");
  await page.getByLabel("Email", { exact: true }).fill("jane@example.com");
  await page.getByRole("checkbox", { name: "Customer Support" }).click();
  await page
    .getByLabel("Tell us what you need", { exact: true })
    .fill("We need customer support for our business.");
  await page.getByRole("checkbox", { name: /I agree/ }).click();
  await page.getByRole("button", { name: "Validate Enquiry" }).click();
  await expect(page.getByRole("status")).toContainText(
    "has not been sent or saved",
  );
});
test("resume picker rejects disguised files and accepts a small PDF", async ({
  page,
}) => {
  await page.goto("/apply");
  const picker = page.getByLabel(/Resume PDF/);
  await picker.setInputFiles({
    name: "bad.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await expect(
    page.getByText("Choose a valid PDF no larger than 2 MB."),
  ).toBeVisible();
  await picker.setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await expect(
    page.getByText("Choose a valid PDF no larger than 2 MB."),
  ).toHaveCount(0);
});
test("disabled submissions fail closed and administration is excluded from indexing", async ({
  request,
  page,
}) => {
  for (const endpoint of ["/api/applications", "/api/business-leads"]) {
    const response = await request.post(endpoint, { data: {} });
    expect(response.status()).toBe(503);
    expect(await response.json()).toMatchObject({ success: false });
  }
  const denied = await page.goto("/admin");
  expect(denied?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Let’s get you back on track." }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  const admin = await request.get("/admin");
  expect(admin.headers()["cache-control"]).toContain("no-store");
  expect(
    (await request.get("/api/admin/applications/export?format=csv")).status(),
  ).toBe(404);
  const download = await request.get("/api/admin/resumes/unknown");
  expect(download.status()).toBe(404);
  const sitemap = await request.get("/sitemap.xml");
  const text = await sitemap.text();
  expect(text).not.toContain("/admin");
  expect(text).toContain("/business-enquiry");
});

test("Careers handles empty or unavailable roles without inventing vacancies", async ({
  page,
}) => {
  await page.goto("/careers");
  await expect(page.getByRole("status")).toContainText(
    /No open roles are listed right now|We couldn’t load roles right now/,
  );
  await expect(page.getByRole("link", { name: /View Role/ })).toHaveCount(0);
  await expect(page.getByText(/Sample jobs only/)).toHaveCount(0);
  await page.goto("/apply?jobId=forged&source=qr");
  await expect(page.getByRole("status")).toContainText(
    /We couldn’t load this role|This role is no longer accepting applications/,
  );
  await expect(page.getByLabel("First Name", { exact: true })).toHaveCount(0);
  await page
    .getByRole("link", {
      name: "Continue with a general application",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/apply\?source=qr$/);
  await expect(page.getByLabel("First Name", { exact: true })).toBeVisible();
});

test("public response headers prevent framing and form errors describe their controls", async ({
  page,
  request,
}) => {
  const response = await request.get("/apply");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  await page.goto("/business-enquiry");
  await page.getByRole("button", { name: "Validate Enquiry" }).click();
  await expect(page.getByLabel("Tell us what you need")).toHaveAttribute(
    "aria-describedby",
    "message-error",
  );
  await expect(
    page.getByRole("checkbox", { name: "Customer Support" }),
  ).toHaveAttribute("aria-describedby", "services-error");
  await expect(page.getByRole("checkbox", { name: /I agree/ })).toHaveAttribute(
    "aria-describedby",
    "business-consent-error",
  );
});
