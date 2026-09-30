import "server-only";
import { parseGoogleEnv, siteEnvSchema } from "./env-schema";

export function getSiteUrl(): string {
  const result = siteEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!result.success)
    throw new Error("Invalid NEXT_PUBLIC_SITE_URL configuration.");
  return result.data.NEXT_PUBLIC_SITE_URL;
}

// Called only by the future server adapter; importing this module needs no Google credentials.
export function getGoogleEnv() {
  return parseGoogleEnv({
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  });
}
