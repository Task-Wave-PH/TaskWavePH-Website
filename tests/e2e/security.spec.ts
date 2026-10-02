import { test, expect } from "@playwright/test";

test("ambiguous admin paths and forged proxy headers do not expose administration", async ({
  request,
}) => {
  for (const path of [
    "/%61dmin",
    "/admin%2Fusers",
    "/api/%61dmin/applications/export",
    "/admin/users",
    "/api/admin/resumes/forged",
  ]) {
    const response = await request.get(path, {
      headers: {
        "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
        "x-forwarded-host": "admin.taskwaveph.test",
        Authorization: "Bearer forged",
        Cookie: "__session=forged",
      },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("Admin setup required");
  }
});

test("forged confirmation receipts never show success and remain uncached", async ({
  request,
}) => {
  for (const [path, form] of [
    ["/apply/success", "/apply"],
    ["/business-enquiry/success", "/business-enquiry"],
  ]) {
    const response = await request.get(`${path}?success=true`, {
      headers: {
        Cookie: "tw-application-receipt=forged; tw-enquiry-receipt=forged",
      },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe(form);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
});

test("security headers protect public pages and submission errors stay safe", async ({
  request,
}) => {
  for (const path of ["/", "/apply", "/privacy", "/areas-of-work"]) {
    const response = await request.get(path);
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers()["content-security-policy"]).toContain(
      "object-src 'none'",
    );
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  }
  for (const path of ["/api/applications", "/api/business-leads"]) {
    const response = await request.post(path, {
      data: "malformed",
      headers: { Origin: "https://attacker.invalid" },
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: "SUBMISSIONS_DISABLED",
    });
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("tracking scripts stay inert and unrelated query values do not enter navigation", async ({
  page,
}) => {
  let dialogs = 0;
  page.on("dialog", async (dialog) => {
    dialogs++;
    await dialog.dismiss();
  });
  await page.goto(
    "/?source=%3Cscript%3Ealert(1)%3C%2Fscript%3E&email=private%40example.invalid",
  );
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(
    hrefs.every(
      (href) => !href?.includes("email=") && !href?.includes("private"),
    ),
  ).toBe(true);
  expect(dialogs).toBe(0);
});
