import { test, expect } from "@playwright/test";

const query =
  "source=cite&campaign=job-fair&utm_source=qr&utm_medium=print&utm_campaign=october";
const routes = ["/areas-of-work", "/how-it-works", "/careers", "/about"];

test("campaign tracking survives multiple page hops and reaches the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/?${query}&email=private@example.com`);
  for (const label of ["Areas of Work", "Careers", "How It Works", "About"]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL((url) => url.search.slice(1) === query);
  }
  await page.getByRole("link", { name: "Apply Now" }).first().click();
  await expect(page).toHaveURL(
    new RegExp(`/apply\\?${query.replaceAll("?", "\\?")}$`),
  );
  await expect(page.locator('input[name="source"]')).toHaveValue("cite");
  await expect(page.locator('input[name="campaign"]')).toHaveValue("job-fair");
});

test("mobile menu supports keyboard dismissal, focus restoration, and page navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await page.goto(`/?${query}`);
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Explore TaskWavePH" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Careers", exact: true }).click();
  await expect(page).toHaveURL(`/careers?${query}`);
  await expect(dialog).toBeHidden();
  await trigger.click();
  await expect(
    dialog.getByRole("link", { name: "Careers", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toBeFocused();
});

test("dedicated pages have metadata, safe preview messaging, and sitemap entries", async ({
  page,
  request,
}) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `http://localhost:3000${route}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `http://localhost:3000${route}`,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      /TaskWavePH/,
    );
    await expect(
      page.getByText(
        "Applications are opening soon. Preview the form; your information will not be sent or saved.",
      ),
    ).toBeVisible();
  }
  await page.goto("/careers");
  await expect(
    page.getByText(/there are no confirmed vacancies listed here/),
  ).toBeVisible();
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const route of routes)
    expect(xml).toContain(`http://localhost:3000${route}`);
});
