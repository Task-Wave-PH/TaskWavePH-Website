import { test, expect } from "@playwright/test";

test("client CTAs preserve tracking and the home page markets services", async ({
  page,
}) => {
  const query =
    "source=cite&campaign=job-fair-2026&utm_source=qr&utm_medium=print&utm_campaign=october";
  await page.goto(`/?${query}&email=private@example.com`);
  await expect(page.getByText(/Applications are opening soon/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Apply Now" })).toHaveCount(0);
  const links = page.getByRole("link", { name: "Discuss Your Business Needs" });
  await expect(links).toHaveCount(2);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", `/business-enquiry?${query}`);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Outsource.Optimize.Grow.",
  );
  await expect(
    page.getByRole("heading", { name: "Reliable Teams", exact: true }),
  ).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000",
  );
});

test("page navigation and keyboard skip link work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  for (const [label, path] of [
    ["Services", "/areas-of-work"],
    ["How It Works", "/how-it-works"],
    ["Careers", "/careers"],
    ["About", "/about"],
  ]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await page.goto("/");
  await page
    .getByRole("link", { name: "Meet TaskWavePH", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
});

test("brand images and local fonts load; the hero CTA fits on mobile", async ({
  page,
}) => {
  const externalFontRequests: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
      externalFontRequests.push(request.url());
  });
  await page.setViewportSize({ width: 360, height: 850 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page
      .locator("section[aria-labelledby='hero-title']")
      .getByRole("link", { name: "Discuss Your Business Needs" }),
  ).toBeInViewport();
  await expect(page.getByAltText("TaskWavePH TW wave monogram")).toBeVisible();
  await page.locator("footer").scrollIntoViewIfNeeded();
  for (const image of await page.locator("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
  }
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toContain("poppins");
  expect(externalFontRequests).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  expect(
    await page
      .getByRole("link", { name: "Discuss Your Business Needs" })
      .first()
      .evaluate((node) => getComputedStyle(node).transitionProperty),
  ).toBe("none");
});
