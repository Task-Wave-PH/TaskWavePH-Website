import "server-only";
import { cache } from "react";
import { cacheableJobList } from "./cache-policy";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
export function publicJobsClient({
  cacheFirstPage = false,
}: { cacheFirstPage?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url, {
    fetch: (input, init) => {
      const cached =
        cacheFirstPage &&
        process.env.NODE_ENV === "production" &&
        cacheableJobList(init);
      return fetch(input, {
        ...init,
        ...(cached
          ? {
              cache: "force-cache" as const,
              next: { revalidate: 60, tags: ["public-jobs"] },
            }
          : { cache: "no-store" as const }),
        signal: AbortSignal.timeout(10000),
      });
    },
  });
}
export const getPublishedJob = cache(async (id: string) => {
  const client = publicJobsClient();
  if (!client) return { state: "unavailable" as const, job: null };
  try {
    return {
      state: "ready" as const,
      job: await client.query(api.jobs.detail, { id }),
    };
  } catch {
    return { state: "unavailable" as const, job: null };
  }
});
