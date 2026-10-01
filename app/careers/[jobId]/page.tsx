import { notFound } from "next/navigation";
import { getPublishedJob } from "@/features/jobs/server";
import { ContentPage } from "@/components/layout/content-page";
import { JobDetails } from "@/components/jobs/job-details";
import type { TrackingQuery } from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const result = await getPublishedJob(jobId);
  if (!result.job)
    return {
      title: "Role unavailable",
      robots: { index: false, follow: false },
    };
  return pageMetadata(
    result.job.title,
    `Explore the ${result.job.title} role with TaskWavePH in ${result.job.location}.`,
    `/careers/${jobId}`,
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<TrackingQuery>;
}) {
  const { jobId } = await params;
  const query = await searchParams;
  const result = await getPublishedJob(jobId);
  if (result.state === "ready" && !result.job) notFound();
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={query}
      eyebrow="Careers"
      title={result.job?.title ?? "Roles are temporarily unavailable."}
      description={
        result.job
          ? "Explore the role and prepare your application."
          : "Please try again later. Your application information has not been sent."
      }
    >
      {result.job && <JobDetails job={result.job} query={query} />}
    </ContentPage>
  );
}
