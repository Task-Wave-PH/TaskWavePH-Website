import { getTrackedHref, type TrackingQuery } from "../applications/tracking";
import type { JobView } from "./schema";

export function jobSlugBase(title: string, timestamp: number): string {
  const words =
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100)
      .replace(/-+$/g, "") || "role";
  const date = new Date(timestamp + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return `${words}-${date}`;
}
export function numberedJobSlug(base: string, sequence: number): string {
  return `${base}-${String(sequence).padStart(2, "0")}`;
}
export function jobKey(job: Pick<JobView, "_id" | "slug">): string {
  return job.slug ?? job._id;
}
export function jobPath(job: Pick<JobView, "_id" | "slug">, preview = false) {
  return `${preview ? "/dev-preview" : ""}/careers/${encodeURIComponent(jobKey(job))}`;
}
export function jobApplyPath(
  job: Pick<JobView, "_id" | "slug">,
  preview = false,
) {
  if (preview)
    return `/dev-preview/job-apply/${encodeURIComponent(jobKey(job))}`;
  return job.slug
    ? `/apply/${encodeURIComponent(job.slug)}`
    : `/apply?jobId=${encodeURIComponent(job._id)}`;
}

export function jobApplyHref(
  job: Pick<JobView, "_id" | "slug">,
  query: TrackingQuery,
  preview = false,
) {
  const url = new URL(jobApplyPath(job, preview), "https://taskwaveph.invalid");
  const tracking = new URL(getTrackedHref("/", query), url.origin);
  for (const [key, value] of tracking.searchParams)
    url.searchParams.set(key, value);
  return url.pathname + url.search;
}
