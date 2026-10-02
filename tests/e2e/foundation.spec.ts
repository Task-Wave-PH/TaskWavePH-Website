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
  await expect
    .poll(() =>
      page
        .getByLabel("First Name", { exact: true })
        .evaluate((node) => node.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(88);
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
  const referral = page.getByLabel(/^Referred by\s*\(optional\)$/);
  await expect(referral).toHaveValue("");
  await expect(referral).toHaveAttribute("maxlength", "200");
  await referral.fill("Synthetic Referrer");
  await page.getByRole("button", { name: "Validate Application" }).click();
  await expect(consent).toBeFocused();
  await consent.press("Space");
  await expect(consent).toBeChecked();
  await page.getByRole("button", { name: "Validate Application" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Application details validated",
  );
  await expect(page).toHaveURL(/\/apply\?source=office-qr$/);
  await expect(referral).toHaveValue("Synthetic Referrer");
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
      const header = page.getByRole("navigation", { name: "Main navigation" });
      await expect(header).toHaveCSS("height", width < 1024 ? "72px" : "80px");
      if (width < 1024) {
        await expect(header.getByRole("link")).toHaveCount(1);
        await expect(
          header.getByRole("button", { name: "Open navigation" }),
        ).toBeVisible();
      }
      await page.evaluate(() =>
        window.scrollTo({ top: 400, behavior: "instant" }),
      );
      await expect
        .poll(() =>
          page
            .locator("header")
            .evaluate((node) => node.getBoundingClientRect().top),
        )
        .toBe(0);
      if (
        ["/", "/areas-of-work", "/how-it-works", "/careers", "/about"].includes(
          route,
        )
      ) {
        if (route === "/" || route === "/areas-of-work") {
          for (const image of await page.locator("main img").all()) {
            await image.scrollIntoViewIfNeeded();
            // Cold CI image optimization can outlast the usual UI assertion
            // deadline. This checks asset readiness, not loading performance.
            try {
              await expect(image).toHaveJSProperty("complete", true, {
                timeout: 15_000,
              });
            } catch (error) {
              const state = await image.evaluate((node) => {
                const image = node as HTMLImageElement;
                return {
                  currentSrc: image.currentSrc,
                  complete: image.complete,
                  naturalWidth: image.naturalWidth,
                  bounds: image.getBoundingClientRect().toJSON(),
                };
              });
              throw new Error(
                `Image readiness failed: ${JSON.stringify(state)}`,
                {
                  cause: error,
                },
              );
            }
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
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
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
