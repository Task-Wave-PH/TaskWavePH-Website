import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";
import { canonicalUrl, shareImage } from "@/lib/seo";

export function pageMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, pathname);
  const image = shareImage(siteUrl);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | TaskWavePH`,
      description,
      url,
      type: "website",
      locale: "en_PH",
      siteName: "TaskWavePH",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TaskWavePH`,
      description,
      images: [image],
    },
  };
}
