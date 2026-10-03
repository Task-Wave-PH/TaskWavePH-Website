import { z } from "zod";
export function qrColorContrast(hex: string) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return (
    1.05 /
    (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 + 0.05)
  );
}
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .refine(
    (v) => qrColorContrast(v) >= 4.5,
    "Choose a darker color for reliable scanning.",
  );
export const qrSettingsSchema = z
  .object({
    style: z.enum(["solid", "gradient"]),
    color: color,
    gradientColor: color,
    logo: z.enum(["symbol", "wordmark", "none", "custom"]),
    logoSize: z.union([z.literal(15), z.literal(20), z.literal(25)]),
    channel: z.enum([
      "linkedin",
      "facebook",
      "instagram",
      "office-qr",
      "job-fair",
      "other",
    ]),
    placement: z.enum(["social", "paid-social", "qr", "referral"]),
  })
  .strict();
export type QrSettings = z.infer<typeof qrSettingsSchema>;
export const defaultQrSettings: QrSettings = {
  style: "solid",
  color: "#0A1D3B",
  gradientColor: "#0D6EFD",
  logo: "symbol",
  logoSize: 25,
  channel: "linkedin",
  placement: "social",
};
export const qrLogoPaths = {
  symbol: "/logo/taskwaveph-symbol.png",
  wordmark: "/logo/taskwaveph-logo-on-white.png",
} as const;
