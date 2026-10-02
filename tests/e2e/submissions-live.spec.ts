import { test, expect, type Page } from "@playwright/test";
import { sampleResumeBytes } from "../../features/applications/sample-resume";
// Only the human widget is substituted. Next.js verifies the official Cloudflare
// test token server-side and writes to the real development Convex backend.
async function challenge(page: Page) {
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: 'window.turnstile={render:(node,options)=>{options.callback("XXXX.DUMMY.TOKEN.XXXX");node.dataset.ready="true";node.textContent="Development challenge ready";return "test-widget"},remove:()=>{}};',
      }),
  );
}
async function application(page: Page) {
  await page.getByLabel("First Name", { exact: true }).fill("Development");
  await page.getByLabel("Last Name", { exact: true }).fill("BrowserTest");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-test@example.invalid");
  await page.getByLabel("Mobile Number", { exact: true }).fill("09171234567");
  await page
    .getByLabel("City / Location", { exact: true })
    .fill("Synthetic test only");
  await page
    .getByLabel("Position Interested In", { exact: true })
    .fill("Development test");
  await page.getByRole("checkbox").check();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}
test("real form/API confirms a saved application with a PDF", async ({
  page,
}) => {
  await challenge(page);
  await page.goto("/apply?source=browser-development-test");
  await application(page);
  await page.getByLabel(/Resume PDF/).setInputFiles({
    name: "synthetic-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(sampleResumeBytes()),
  });
  const saved = page.waitForResponse((response) =>
    response.url().endsWith("/api/applications"),
  );
  await page.getByRole("button", { name: "Submit Application" }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  // The full success navigation discards the browser's previous response body.
  // Confirm persistence through the 200 response and server-issued receipt.
  await expect(page).toHaveURL(/\/apply\/success$/);
  const receipt = (await page.context().cookies()).find(
    (cookie) => cookie.name === "tw-application-receipt",
  );
  expect(receipt?.httpOnly).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Application received." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Application received." }),
  ).toBeVisible();
});
test("real business enquiry is saved before confirmation", async ({ page }) => {
  await challenge(page);
  await page.goto("/business-enquiry?source=browser-development-test");
  await page
    .getByLabel("Company", { exact: true })
    .fill("Synthetic browser company");
  await page
    .getByLabel("Contact Name", { exact: true })
    .fill("Development BrowserTest");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-lead@example.invalid");
  await page.getByRole("checkbox", { name: "Customer Support" }).check();
  await page
    .getByLabel("Tell us what you need")
    .fill("Synthetic development enquiry only.");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  const saved = page.waitForResponse((response) =>
    response.url().endsWith("/api/business-leads"),
  );
  await page.getByRole("button", { name: "Send Business Enquiry" }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/business-enquiry\/success$/);
  await expect(
    page.getByRole("heading", { name: "Enquiry received." }),
  ).toBeVisible();
  expect(
    (await page.context().cookies()).find(
      (cookie) => cookie.name === "tw-enquiry-receipt",
    )?.httpOnly,
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Enquiry received." }),
  ).toBeVisible();
  await page.goto("/apply/success");
  await expect(page).toHaveURL(/\/apply$/);
  const enquiryReceipt = (await page.context().cookies()).find(
    (cookie) => cookie.name === "tw-enquiry-receipt",
  );
  expect(enquiryReceipt).toBeDefined();
  await page
    .context()
    .addCookies([{ ...enquiryReceipt!, value: "altered-receipt" }]);
  await page.goto("/business-enquiry/success");
  await expect(page).toHaveURL(/\/business-enquiry$/);
  await page.context().clearCookies();
  await page.goto("/business-enquiry/success");
  await expect(page).toHaveURL(/\/business-enquiry$/);
});
test("failed submission retains entries and does not show success", async ({
  page,
}) => {
  await challenge(page);
  await page.goto("/apply");
  await application(page);
  await page.route("**/api/applications", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "SUBMISSION_FAILED" }),
    }),
  );
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "couldn't submit" }),
  ).toContainText("couldn't submit");
  await expect(page.getByLabel("First Name", { exact: true })).toHaveValue(
    "Development",
  );
  await expect(page).toHaveURL(/\/apply$/);
});

test("real Turnstile fits public forms at all supported widths", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const route of ["/apply", "/business-enquiry"]) {
    await page.goto(route);
    const notice = page.getByRole("button", { name: "Got it", exact: true });
    if (await notice.isVisible()) await notice.click();
    for (const width of [360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      const host = page.locator('[aria-label="Security check"]');
      await expect(
        page.getByText("Security check complete.", { exact: true }),
      ).toBeVisible({ timeout: 20000 });
      // Cloudflare encapsulates its iframe in a closed shadow root. Measure
      // the real child frame viewport rather than querying through that root.
      await expect
        .poll(async () => {
          const frame = page
            .frames()
            .find((frame) =>
              frame.url().startsWith("https://challenges.cloudflare.com/"),
            );
          if (!frame) return false;
          try {
            return (
              (await frame.evaluate(() => innerWidth)) <=
              (await host.evaluate(
                (node) => node.getBoundingClientRect().width,
              ))
            );
          } catch {
            return false;
          }
        })
        .toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("rate-limit cooldown prevents repeated requests and keeps the retry token", async ({
  page,
}) => {
  await challenge(page);
  await page.goto("/apply");
  await application(page);
  const tokens: string[] = [];
  await page.route("**/api/applications", async (route) => {
    const request = route.request();
    const body = await new Request("http://test", {
      method: "POST",
      headers: { "Content-Type": request.headers()["content-type"] },
      body: new Uint8Array(request.postDataBuffer()!),
    }).formData();
    tokens.push(String(body.get("submissionToken")));
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: { "Retry-After": "2" },
      body: JSON.stringify({
        success: false,
        error: "RATE_LIMITED",
        retryAfterSeconds: 2,
      }),
    });
  });
  await page.getByRole("button", { name: "Submit Application" }).click();
  const button = page.getByRole("button", { name: /Try again in/ });
  await expect(button).toBeDisabled();
  await page.getByLabel("First Name", { exact: true }).press("Enter");
  expect(tokens).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Submit Application" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens[0]).toBe(tokens[1]);
  await expect(page.getByLabel("First Name", { exact: true })).toHaveValue(
    "Development",
  );
});

test("timed-out requests unlock safely and retain the same token", async ({
  page,
}) => {
  await page.clock.install();
  await challenge(page);
  await page.goto("/apply");
  await application(page);
  let pending: import("@playwright/test").Route | undefined;
  const tokens: string[] = [];
  await page.route("**/api/applications", async (route) => {
    const request = route.request();
    const body = await new Request("http://test", {
      method: "POST",
      headers: { "Content-Type": request.headers()["content-type"] },
      body: new Uint8Array(request.postDataBuffer()!),
    }).formData();
    tokens.push(String(body.get("submissionToken")));
    if (tokens.length === 1) pending = route;
    else
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "SUBMISSION_FAILED" }),
      });
  });
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect.poll(() => tokens.length).toBe(1);
  await page.clock.fastForward(90001);
  await expect(
    page.getByRole("alert").filter({ hasText: "may have completed" }),
  ).toBeVisible();
  await pending?.abort().catch(() => {});
  await page.clock.fastForward(4000);
  await expect(
    page.getByRole("button", { name: "Submit Application" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens[0]).toBe(tokens[1]);
  await expect(page.getByLabel("First Name", { exact: true })).toHaveValue(
    "Development",
  );
});

test("blocked challenge scripts show retry without losing business entries", async ({
  page,
}) => {
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js*",
    (route) => route.abort(),
  );
  await page.goto("/business-enquiry");
  await page
    .getByLabel("Company", { exact: true })
    .fill("Synthetic retained company");
  await expect(
    page.getByRole("button", { name: "Retry Security Check" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send Business Enquiry" }),
  ).toBeDisabled();
  await page.unroute("https://challenges.cloudflare.com/turnstile/v0/api.js*");
  await page.getByRole("button", { name: "Retry Security Check" }).click();
  await expect(
    page.getByText("Security check complete.", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("Company", { exact: true })).toHaveValue(
    "Synthetic retained company",
  );
});
