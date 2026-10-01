import { test, expect } from "@playwright/test";

test("cookie acknowledgment persists, can be reopened, and never selects form consent", async ({
  page,
}) => {
  await page.goto("/apply");
  const notice = page.getByRole("complementary", {
    name: "Cookie notice",
    exact: true,
  });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "tw-cookie-notice",
  );
  expect(cookie?.value).toBe("1");
  expect(cookie?.path).toBe("/");
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(179 * 86400);
  await page.reload();
  await expect(notice).toHaveCount(0);
  const trigger = page
    .locator("footer")
    .getByRole("button", { name: "Cookie information", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie information",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("old notice versions reappear and the notice survives blocked browser storage", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "tw-cookie-notice", value: "0", url: baseURL! },
  ]);
  await page.goto("/");
  const notice = page.getByRole("complementary", {
    name: "Cookie notice",
    exact: true,
  });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Got it", exact: true }).click();
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === "tw-cookie-notice",
    )?.value,
  ).toBe("1");
  await context.clearCookies();
  await page.addInitScript(() =>
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        throw new Error("Storage unavailable");
      },
      set() {
        throw new Error("Storage unavailable");
      },
    }),
  );
  await page.reload();
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await page.reload();
  await expect(notice).toBeVisible();
});

test("policy pages, service footer links and workflow anchors preserve tracking", async ({
  page,
  request,
}) => {
  await page.goto("/privacy?source=policy-test&email=private@example.invalid");
  await page
    .getByRole("complementary", { name: "Cookie notice", exact: true })
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: "Cookies and security" })
    .click();
  await expect(page).toHaveURL(/#cookies$/);
  await expect(page.getByRole("table")).toBeVisible();
  await page
    .locator("footer")
    .getByRole("link", { name: "Website Terms", exact: true })
    .click();
  await expect(page).toHaveURL(/\/terms\?source=policy-test$/);
  await expect(
    page.getByRole("heading", { name: "Website Terms", exact: true }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000/terms",
  );
  const services = page.getByRole("navigation", {
    name: "Footer services navigation",
  });
  await expect(
    services.getByRole("link", { name: "Digital Marketing", exact: true }),
  ).toHaveAttribute(
    "href",
    "/areas-of-work?source=policy-test#digital-marketing",
  );
  await page.goto("/how-it-works?source=policy-test");
  const workflow = page.getByRole("list", {
    name: "Business collaboration workflow",
  });
  await expect(workflow.getByRole("listitem")).toHaveCount(3);
  await workflow.getByRole("link").nth(1).click();
  await expect(page).toHaveURL(/#step-2$/);
  await expect(
    page.getByRole("heading", {
      name: "Connect the needs with suitable support.",
    }),
  ).toBeInViewport();
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "http://localhost:3000/terms",
  );
});
