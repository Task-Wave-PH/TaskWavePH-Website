import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/apply", "/privacy"].map((path) => ({
    url: new URL(path, getSiteUrl()).toString(),
  }));
}
