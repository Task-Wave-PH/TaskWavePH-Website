import {
  defaultQrSettings,
  qrSettingsSchema,
  qrLogoPaths,
  type QrSettings,
} from "../settings/qr";
// Loaded only for QR previews and downloads; logos retain their original proportions.
export async function createCampaignQr(
  link: string,
  settings: QrSettings = defaultQrSettings,
  customLogoSource = "/api/admin/qr-logo",
): Promise<string> {
  const values = qrSettingsSchema.parse(settings);
  const QRCode = await import("qrcode");
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, link, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#FFFFFF00" },
  });
  const context = canvas.getContext("2d");
  if (!context) throw new Error("QR_CANVAS_UNAVAILABLE");
  context.globalCompositeOperation = "source-in";
  if (values.style === "gradient") {
    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    gradient.addColorStop(0, values.color);
    gradient.addColorStop(1, values.gradientColor);
    context.fillStyle = gradient;
  } else context.fillStyle = values.color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
  if (values.logo !== "none") {
    const logo = new Image();
    logo.src =
      values.logo === "custom" ? customLogoSource : qrLogoPaths[values.logo];
    await logo.decode();
    const size = Math.round((canvas.width * values.logoSize) / 100);
    const scale = size / Math.max(logo.naturalWidth, logo.naturalHeight);
    const width = logo.naturalWidth * scale;
    const height = logo.naturalHeight * scale;
    const padding = canvas.width * 0.015;
    context.fillStyle = "#FFFFFF";
    context.fillRect(
      (canvas.width - width) / 2 - padding,
      (canvas.height - height) / 2 - padding,
      width + padding * 2,
      height + padding * 2,
    );
    context.drawImage(
      logo,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    );
  }
  return canvas.toDataURL("image/png");
}
