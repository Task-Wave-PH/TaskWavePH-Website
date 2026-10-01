import "server-only";
import { siteEnvSchema } from "./env-schema";

export function getSiteUrl(): string {
  const result = siteEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!result.success)
    throw new Error("Invalid NEXT_PUBLIC_SITE_URL configuration.");
  return result.data.NEXT_PUBLIC_SITE_URL;
}
