import { test, expect } from "@playwright/test";
import { applicationEmail } from "../../features/notifications/application-email";

test("staff notification email wraps long content and keeps its protected link usable", async ({
  page,
}) => {
  await page.route("**/*", (route) => route.abort());
  const email = applicationEmail({
    names: ["W".repeat(201), "Second Applicant", "Third Applicant"],
    total: 5,
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
      page.getByRole("heading", { name: "New applicants" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Applications" }),
    ).toHaveAttribute("href", "https://admin.taskwaveph.com/applications");
  }
  await expect(page.locator("body")).toContainText("+2 more new applicants");
});
