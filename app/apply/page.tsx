import { permanentRedirect } from "next/navigation";
import { ApplicationPage } from "@/components/application/application-page";
import { getPublishedJob } from "@/features/jobs/server";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
export const metadata = pageMetadata(
  "Recruitment Application",
  "Apply to TaskWavePH for recruitment consideration. Share your experience, preferred role, and optional PDF resume through our application form.",
  "/apply",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const identifier =
    query.jobId === undefined
      ? undefined
      : typeof query.jobId === "string" && query.jobId
        ? query.jobId
        : "invalid-job";
  if (identifier) {
    const result = await getPublishedJob(identifier);
    if (result.job?.slug)
      permanentRedirect(getTrackedHref(`/apply/${result.job.slug}`, query));
  }
  return <ApplicationPage query={query} identifier={identifier} />;
}
