import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";

export function pageMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  const url = new URL(pathname, getSiteUrl()).toString();
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
    },
    twitter: { card: "summary", title: `${title} | TaskWavePH`, description },
  };
}
