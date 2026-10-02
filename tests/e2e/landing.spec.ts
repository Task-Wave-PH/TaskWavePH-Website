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
    await image.scrollIntoViewIfNeeded();
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

test("home service cards preserve tracking and open the matching service", async ({
  page,
}) => {
  await page.goto("/?source=home-cards&email=private@example.invalid");
  await page
    .getByRole("complementary", { name: "Cookie notice", exact: true })
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  const section = page.locator("section[aria-labelledby='services-title']");
  const card = section.getByRole("link", {
    name: "Digital Marketing",
    exact: true,
  });
  await expect(card).toHaveAttribute(
    "href",
    "/areas-of-work?source=home-cards#digital-marketing",
  );
  await card.click();
  await expect(page).toHaveURL(
    /\/areas-of-work\?source=home-cards#digital-marketing$/,
  );
  await expect(
    page.getByRole("heading", {
      name: "Keep your brand’s digital work moving.",
      exact: true,
    }),
  ).toBeInViewport();
});

test("motion respects reduced preferences and marketing content remains usable without JavaScript", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Cookie notice", exact: true })
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  const card = page.locator(".public-service-card").first();
  await card.hover();
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("transition-property", "none");
  expect(
    await page
      .locator("[data-motion-reveal]")
      .evaluateAll((nodes) =>
        nodes.every((node) => node.getAnimations().length === 0),
      ),
  ).toBe(true);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const staticPage = await context.newPage();
    await staticPage.goto("/?source=no-js");
    await expect(staticPage.getByRole("heading", { level: 1 })).toBeVisible();
    const service = staticPage
      .locator("section[aria-labelledby='services-title']")
      .getByRole("link", { name: "Digital Marketing", exact: true });
    await expect(service).toBeVisible();
    await service.click();
    await expect(staticPage).toHaveURL(
      /\/areas-of-work\?source=no-js#digital-marketing$/,
    );
  } finally {
    await context.close();
  }
});

test("reveals play once, cancel on keyboard focus, and stop when reduced motion is enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.hasAttribute("data-motion-reveal")) {
        this.setAttribute(
          "data-reveal-plays",
          String(Number(this.getAttribute("data-reveal-plays") || 0) + 1),
        );
        const timing = args[1];
        // Keep the effect open long enough to exercise focus/preference cancellation reliably.
        if (typeof timing === "object") args[1] = { ...timing, duration: 5000 };
      }
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Cookie notice", exact: true })
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  const firstCard = page.locator(".public-service-card").first();
  const reveal = firstCard.locator("..");
  await firstCard.scrollIntoViewIfNeeded();
  // Motion mini creates one native animation per property (opacity and transform).
  await expect(reveal).toHaveAttribute("data-reveal-plays", "2");
  await firstCard.focus();
  await expect
    .poll(() => reveal.evaluate((node) => node.getAnimations().length))
    .toBe(0);
  await expect(reveal).toHaveCSS("opacity", "1");
  await expect(reveal).toHaveCSS("transform", "none");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await firstCard.scrollIntoViewIfNeeded();
  // Motion mini creates one native animation per property (opacity and transform).
  await expect(reveal).toHaveAttribute("data-reveal-plays", "2");
  const lastCard = page.locator(".public-service-card").last();
  await lastCard.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator("[data-motion-reveal]")
        .evaluateAll((nodes) =>
          nodes.reduce((count, node) => count + node.getAnimations().length, 0),
        ),
    )
    .toBe(0);
  await expect(reveal).toHaveCSS("opacity", "1");
  await expect(reveal).toHaveCSS("transform", "none");
});
