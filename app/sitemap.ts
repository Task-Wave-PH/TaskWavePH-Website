import { publicJobsClient } from "@/features/jobs/server";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs: MetadataRoute.Sitemap = [];
  try {
    const client = publicJobsClient();
    if (client) {
      let cursor: string | null = null;
      const deadline = Date.now() + 15000;
      for (let page = 0; page < 50 && Date.now() < deadline; page++) {
        const result: FunctionReturnType<typeof api.jobs.published> =
          await client.query(api.jobs.published, {
            paginationOpts: { numItems: 100, cursor },
          });
        jobs.push(
          ...result.page.map((job) => ({
            url: new URL(`/careers/${job._id}`, getSiteUrl()).toString(),
            lastModified: new Date(job.updatedAt),
          })),
        );
        if (result.isDone) break;
        cursor = result.continueCursor;
      }
    }
  } catch {
    /* Public static pages remain discoverable during a backend outage. */
  }
  return [
    ...jobs,
    ...[
      "/",
      "/areas-of-work",
      "/how-it-works",
      "/careers",
      "/business-enquiry",
      "/about",
      "/apply",
      "/privacy",
      "/terms",
    ].map((path) => ({
      url: new URL(path, getSiteUrl()).toString(),
    })),
  ];
}
