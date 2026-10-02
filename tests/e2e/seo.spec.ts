import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/areas-of-work",
  "/how-it-works",
  "/about",
  "/careers",
  "/apply",
  "/business-enquiry",
  "/privacy",
  "/terms",
];

test("public pages have unique metadata and clean canonical social URLs", async ({
  page,
}) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of routes) {
    await page.goto(`${route}?source=qr&campaign=test`);
    const canonical =
      route === "/" ? "http://localhost:3000" : `http://localhost:3000${route}`;
    const title = await page.title();
    expect(title).toContain("TaskWavePH");
    expect(titles.has(title)).toBe(false);
    titles.add(title);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toBeTruthy();
    expect(descriptions.has(description!)).toBe(false);
    descriptions.add(description!);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      canonical,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/images/seo/taskwaveph-share.png",
    );
    await expect(
      page.locator('meta[property="og:image:width"]'),
    ).toHaveAttribute("content", "1200");
    await expect(
      page.locator('meta[property="og:image:height"]'),
    ).toHaveAttribute("content", "630");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator("h1")).toHaveCount(1);
  }
});

test("company schema is homepage-only and unavailable roles remain noindex", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const data = JSON.parse(
    await page.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(
    data["@graph"].map((entity: { "@type": string }) => entity["@type"]),
  ).toEqual(["Organization", "WebSite"]);
  await page.goto("/admin");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );
  await page.goto("/careers/not-a-job");
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  for (const directive of robots) expect(directive).toContain("noindex");
  const image = await request.get("/images/seo/taskwaveph-share.png");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
});
