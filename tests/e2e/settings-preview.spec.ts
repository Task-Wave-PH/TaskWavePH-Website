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
