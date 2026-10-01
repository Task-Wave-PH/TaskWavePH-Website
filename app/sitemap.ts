import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/areas-of-work",
    "/how-it-works",
    "/careers",
    "/business-enquiry",
    "/about",
    "/apply",
    "/privacy",
  ].map((path) => ({
    url: new URL(path, getSiteUrl()).toString(),
  }));
}
