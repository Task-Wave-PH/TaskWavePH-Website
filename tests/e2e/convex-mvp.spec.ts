import { test, expect } from "@playwright/test";
test("local UI previews are unavailable in production", async ({ request }) => {
  for (const page of ["login", "applications", "businessLeads"]) {
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
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin setup required" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  const admin = await request.get("/admin");
  expect(admin.headers()["cache-control"]).toContain("no-store");
  const download = await request.get("/api/admin/resumes/unknown");
  expect(download.status()).toBe(503);
  const sitemap = await request.get("/sitemap.xml");
  const text = await sitemap.text();
  expect(text).not.toContain("/admin");
  expect(text).toContain("/business-enquiry");
});
