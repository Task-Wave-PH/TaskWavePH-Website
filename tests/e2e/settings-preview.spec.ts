import jsQR from "jsqr";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { test, expect } from "@playwright/test";
for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`Owner QR settings fit ${width}px and reject light colors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dev-preview/settings");
    await expect(
      page.getByRole("heading", { name: "Settings", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Primary color", { exact: true }).fill("#FFFFFF");
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Choose valid dark colors" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Discard changes" }).click();
    await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
      "#0A1D3B",
    );
  });
}
for (const logo of ["symbol", "wordmark", "none"]) {
  test(`gradient QR with ${logo} logo remains readable and settings save`, async ({
    page,
  }) => {
    await page.goto("/dev-preview/settings");
    await page.getByLabel("Style", { exact: true }).click();
    await page.getByRole("option", { name: "gradient", exact: true }).click();
    await page.getByLabel("Logo", { exact: true }).click();
    await page.getByRole("option", { name: logo, exact: true }).click();
    await page.getByRole("button", { name: "Preview QR", exact: true }).click();
    await expect(
      page.getByRole("img", { name: "TaskWavePH sample campaign QR code" }),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Download sample", exact: true })
      .click();
    const image = await loadImage((await (await download).path())!);
    for (const size of [1024, 320]) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, size, size);
      expect(
        jsQR(
          new Uint8ClampedArray(ctx.getImageData(0, 0, size, size).data),
          size,
          size,
        )?.data,
      ).toContain("campaign=sample-campaign");
    }
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(
      page.getByText("Sample settings saved. No database changes were made.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save settings", exact: true }),
    ).toBeDisabled();
  });
}
test("sample QR attribution follows the selected campaign defaults", async ({
  page,
}) => {
  await page.goto("/dev-preview/settings");
  await page.getByLabel("Default channel", { exact: true }).click();
  await page.getByRole("option", { name: "facebook", exact: true }).click();
  await page.getByLabel("Default placement", { exact: true }).click();
  await page.getByRole("option", { name: "qr", exact: true }).click();
  await page.getByRole("button", { name: "Preview QR", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Download sample", exact: true })
    .click();
  const image = await loadImage((await (await download).path())!);
  const canvas = createCanvas(320, 320);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 320, 320);
  const decoded = jsQR(
    new Uint8ClampedArray(ctx.getImageData(0, 0, 320, 320).data),
    320,
    320,
  )?.data;
  expect(decoded).toBeTruthy();
  const url = new URL(decoded!);
  expect(url.searchParams.get("source")).toBe("facebook");
  expect(url.searchParams.get("utm_source")).toBe("facebook");
  expect(url.searchParams.get("utm_medium")).toBe("qr");
});
test("PNG logo selection previews before saving and never calls private services in preview", async ({
  page,
}) => {
  let privateRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/admin/qr-logo")) privateRequests++;
  });
  await page.goto("/dev-preview/settings");
  await page.getByLabel("Upload QR logo", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("<svg></svg>"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Choose a valid static PNG" }),
  ).toBeVisible();
  await page
    .getByLabel("Upload QR logo", { exact: true })
    .setInputFiles("public/logo/taskwaveph-symbol.png");
  await expect(
    page.getByRole("img", { name: "Selected QR logo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Selected locally. Uploads when you save settings.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview QR", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "TaskWavePH sample campaign QR code" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(
    page.getByText("Sample settings saved. No database changes were made.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview QR", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "TaskWavePH sample campaign QR code" }),
  ).toBeVisible();
  expect(privateRequests).toBe(0);
});

test("event campaign QR opens a general sample application with attribution", async ({
  page,
}) => {
  await page.goto("/dev-preview/settings");
  await page
    .getByRole("button", { name: "Create event campaign & QR" })
    .click();
  await page
    .getByLabel("Campaign name", { exact: true })
    .fill("com-sayahan-2026");
  await page
    .getByRole("button", { name: "Create campaign link", exact: true })
    .click();
  const link = await page.getByLabel("Shareable URL").inputValue();
  expect(new URL(link).pathname).toBe("/dev-preview/job-apply");
  expect(new URL(link).searchParams.get("campaign")).toBe("com-sayahan-2026");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download QR", exact: true }).click();
  const image = await loadImage((await (await download).path())!);
  const canvas = createCanvas(320, 320);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 320, 320);
  expect(
    jsQR(new Uint8ClampedArray(ctx.getImageData(0, 0, 320, 320).data), 320, 320)
      ?.data,
  ).toBe(link);
  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: "Try a general application." }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample role unavailable.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByLabel("First Name", { exact: true })).toBeVisible();
});

test("unsaved settings protect navigation and refresh, then clear after saving", async ({
  page,
}) => {
  await page.goto("/dev-preview/settings");
  await page.getByLabel("Primary color", { exact: true }).fill("#111827");
  const link = page.getByRole("link", { name: "Dashboard", exact: true });
  await link.click();
  const dialog = page.getByRole("alertdialog", {
    name: "You have unsaved changes.",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Keep editing" }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#111827",
  );
  await expect(link).toBeFocused();
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  await page.getByLabel("Primary color", { exact: true }).fill("#0A1D3B");
  await link.click();
  await dialog
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dev-preview$/);
});

test("reverting settings clears protection and restored pages remain protected", async ({
  page,
}) => {
  await page.goto("/dev-preview/settings");
  const input = page.getByLabel("Primary color", { exact: true });
  await input.fill("#111827");
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeEnabled();
  await input.fill("#0A1D3B");
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  await input.fill("#111827");
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/dev-preview/settings?test=unsaved";
    link.textContent = "Test same-editor navigation";
    document.querySelector("main")!.append(link);
  });
  await page.getByRole("link", { name: "Test same-editor navigation" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page).toHaveURL(/test=unsaved/);
  await input.fill("#111827");
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(true);
  await page
    .locator("main")
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeDisabled();
});

test("closing a dirty editor asks for browser confirmation", async ({
  page,
}) => {
  await page.goto("/dev-preview/settings");
  await page.getByLabel("Primary color", { exact: true }).fill("#111827");
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeEnabled();
  const pending = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const dialog = await pending;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  expect(page.isClosed()).toBe(false);
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#111827",
  );
});
