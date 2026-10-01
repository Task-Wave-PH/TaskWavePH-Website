import { test, expect } from "@playwright/test";

test("career CTA preserves only approved tracking", async ({ page }) => {
  await page.goto(
    "/careers?source=cite&campaign=job-fair-2026&utm_source=qr&utm_medium=print&utm_campaign=october&email=private@example.com",
  );
  await page.getByRole("link", { name: "Apply Now" }).first().click();
  await expect(page).toHaveURL(
    /\/apply\?source=cite&campaign=job-fair-2026&utm_source=qr&utm_medium=print&utm_campaign=october$/,
  );
  for (const [name, value] of Object.entries({
    source: "cite",
    campaign: "job-fair-2026",
    utm_source: "qr",
    utm_medium: "print",
    utm_campaign: "october",
    landing_page: "/apply",
  })) {
    await expect(page.locator(`input[name="${name}"]`)).toHaveValue(value);
  }
});

test("form validates, focuses errors, requires consent, and sends no application", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/apply?source=office-qr");
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await page.getByRole("button", { name: "Validate Application" }).click();
  await expect(page.getByLabel("First Name", { exact: true })).toBeFocused();
  await expect(
    page.getByText("Please agree to the privacy notice."),
  ).toBeVisible();
  await page.getByLabel("First Name", { exact: true }).fill("Maria");
  await page.getByLabel("Last Name", { exact: true }).fill("Santos");
  await page.getByLabel("Email", { exact: true }).fill("maria@example.com");
  await page.getByLabel("Mobile Number", { exact: true }).fill("0917 123 4567");
  await page.getByLabel("City / Location", { exact: true }).fill("Cebu");
  await page
    .getByLabel("Position Interested In", { exact: true })
    .fill("Customer Service");
  await page.getByRole("button", { name: "Validate Application" }).click();
  await expect(consent).toBeFocused();
  await consent.press("Space");
  await expect(consent).toBeChecked();
  await page.getByRole("button", { name: "Validate Application" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Application details validated",
  );
  await expect(page).toHaveURL(/\/apply\?source=office-qr$/);
  expect(posts).toEqual([]);
  await page.getByLabel("First Name", { exact: true }).fill("Marian");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("privacy has expected content and direct confirmation access returns to the form", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Draft notice/)).toBeVisible();
  await page.goto("/apply/success");
  await expect(page).toHaveURL(/\/apply$/);
  await expect(
    page.getByRole("heading", { name: "Application received." }),
  ).toHaveCount(0);
  await page.goto("/business-enquiry/success?success=true");
  await expect(page).toHaveURL(/\/business-enquiry$/);
  await expect(
    page.getByRole("heading", { name: "Enquiry received." }),
  ).toHaveCount(0);
});

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`pages fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    for (const route of [
      "/",
      "/areas-of-work",
      "/how-it-works",
      "/careers",
      "/about",
      "/apply",
      "/business-enquiry",
      "/privacy",
      "/terms",
      "/apply/success",
      "/business-enquiry/success",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      if (
        ["/", "/areas-of-work", "/how-it-works", "/careers", "/about"].includes(
          route,
        )
      ) {
        if (route === "/areas-of-work") {
          for (const image of await page.locator("main img").all()) {
            await image.scrollIntoViewIfNeeded();
            await expect(image).toHaveJSProperty("complete", true);
            expect(
              await image.evaluate(
                (node) => (node as HTMLImageElement).naturalWidth,
              ),
            ).toBeGreaterThan(0);
          }
        }
        await page.locator("footer").scrollIntoViewIfNeeded();
        await expect(page.locator("footer img")).toHaveJSProperty(
          "complete",
          true,
        );
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: test
            .info()
            .outputPath(
              `${route === "/" ? "landing" : route.slice(1)}-${width}.png`,
            ),
          fullPage: true,
        });
      }
    }
  });
}
