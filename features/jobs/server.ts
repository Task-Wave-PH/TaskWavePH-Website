import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
export function publicJobsClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url, {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
  });
}
export async function getPublishedJob(id: string) {
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
}
