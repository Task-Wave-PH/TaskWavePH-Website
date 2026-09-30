import { test, expect } from "@playwright/test";

test("every Apply Now link preserves tracking and the page explains its availability", async ({
  page,
}) => {
  const query =
    "source=cite&campaign=job-fair-2026&utm_source=qr&utm_medium=print&utm_campaign=october";
  await page.goto(`/?${query}&email=private@example.com`);
  await expect(
    page.getByText("Applications are opening soon. You can preview the form."),
  ).toBeVisible();
  const links = page.getByRole("link", { name: "Apply Now" });
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", `/apply?${query}`);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Make your next move.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000",
  );
});

test("section links navigate to real content and keyboard users can skip navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  for (const [label, id] of [
    ["Areas of Work", "areas-of-work"],
    ["How It Works", "how-it-works"],
    ["About", "about"],
    ["Meet TaskWavePH", "about"],
  ]) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
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
      .getByRole("link", { name: "Apply Now" }),
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
  expect(
    await page
      .getByRole("link", { name: "Apply Now" })
      .first()
      .evaluate((node) => getComputedStyle(node).transitionProperty),
  ).toBe("none");
});
