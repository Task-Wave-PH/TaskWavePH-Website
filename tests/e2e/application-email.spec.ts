import { test, expect } from "@playwright/test";
import { applicationEmail } from "../../features/notifications/application-email";

test("staff notification email wraps long content and keeps its protected link usable", async ({
  page,
}) => {
  await page.route("**/*", (route) => route.abort());
  const email = applicationEmail({
    id: "synthetic-id",
    reference: "TW-A-1792670400000-jh7xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    role: "W".repeat(200),
    submittedAt: Date.UTC(2026, 9, 22),
    adminUrl: "https://admin.taskwaveph.com",
  });
  await page.setContent(email.html);
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("heading", { name: "New application received" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Application" }),
    ).toHaveAttribute(
      "href",
      "https://admin.taskwaveph.com/applications/synthetic-id",
    );
  }
  await expect(page.locator("body")).toContainText(
    "TW-A-1792670400000-jh7xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  );
});
