import { test, expect } from "@playwright/test";

const query =
  "source=cite&campaign=job-fair&utm_source=qr&utm_medium=print&utm_campaign=october";
const routes = ["/areas-of-work", "/how-it-works", "/careers", "/about"];

test("campaign tracking survives multiple page hops and reaches the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/?${query}&email=private@example.com`);
  for (const label of ["Services", "Careers", "How It Works", "About"]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL((url) => url.search.slice(1) === query);
  }
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Careers", exact: true })
    .click();
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
    if (route === "/careers") {
      await expect(page.getByRole("link", { name: "Apply Now" })).toHaveCount(
        2,
      );
      await expect(
        page.getByText(
          "Applications are opening soon. Preview the form; your information will not be sent or saved.",
        ),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Apply Now" })).toHaveCount(
        0,
      );
      await expect(
        page.getByRole("link", { name: "Discuss Your Business Needs" }),
      ).toBeVisible();
    }
  }
  await page.goto("/careers");
  await expect(
    page.getByRole("heading", { name: "Open roles", exact: true }),
  ).toBeVisible();
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const route of routes)
    expect(xml).toContain(`http://localhost:3000${route}`);
});

test("service details have working anchors, illustrations, and tracked enquiry links", async ({
  page,
}) => {
  await page.goto(`/areas-of-work?${query}&email=private@example.com`);
  const navigation = page.getByRole("navigation", {
    name: "Jump to a service",
  });
  await expect(navigation.getByRole("link")).toHaveCount(6);
  await navigation
    .getByRole("link", { name: "Digital Marketing", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp("#digital-marketing$"));
  const section = page.locator("#digital-marketing");
  await expect(section).toBeInViewport();
  await expect(section.getByRole("heading", { level: 2 })).toHaveText(
    "Keep your brand’s digital work moving.",
  );
  for (const id of [
    "customer-support",
    "digital-marketing",
    "web-development",
    "virtual-assistance",
    "admin-business-support",
    "lead-generation-sales",
  ]) {
    const service = page.locator(`#${id}`);
    await service.scrollIntoViewIfNeeded();
    const illustration = service.locator("img");
    await expect(illustration).toHaveAttribute("alt", "");
    await expect(illustration).toHaveJSProperty("complete", true);
    expect(
      await illustration.evaluate(
        (node) => (node as HTMLImageElement).naturalWidth,
      ),
    ).toBeGreaterThan(0);
    await expect(service.getByRole("listitem")).toHaveCount(3);
    await expect(service.getByRole("link")).toHaveAttribute(
      "href",
      `/business-enquiry?${query}`,
    );
  }
  await expect(
    page.getByRole("link", {
      name: "Discuss Your Business Needs",
      exact: true,
    }),
  ).toHaveCount(1);
});
