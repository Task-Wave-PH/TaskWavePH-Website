import { test, expect } from "@playwright/test";

// Read-only checks; requires the localhost development Clerk configuration.
test("signed-out admin routes redirect to login", async ({ page }) => {
  for (const path of ["/admin", "/admin/users", "/admin/applications"]) {
    await page.goto(path);
    test.skip(
      (await page
        .getByRole("heading", { name: "Admin setup required" })
        .count()) > 0,
      "Configure development Clerk and Convex to verify real signed-out routing.",
    );
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await expect(
      page.getByRole("link", { name: "Users", exact: true }),
    ).toHaveCount(0);
  }
});

test("unavailable Clerk script offers native recovery without revealing the dashboard", async ({
  page,
}) => {
  test.setTimeout(40_000);
  await page.route("**/*clerk*.js*", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  test.skip(
    (await page
      .getByRole("heading", { name: "Admin setup required" })
      .count()) > 0,
    "Configure development Clerk and Convex to verify the blocked-script state.",
  );
  await expect(page.getByRole("status")).toContainText("Checking staff access");
  const retry = page.getByRole("link", { name: "Try again", exact: true });
  await expect(retry).toBeHidden();
  await expect(retry).toBeVisible({ timeout: 26_000 });
  await expect(retry).toHaveAttribute("href", "/admin");
  await expect(
    page.getByRole("link", { name: "Users", exact: true }),
  ).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(retry).toBeVisible();
});
