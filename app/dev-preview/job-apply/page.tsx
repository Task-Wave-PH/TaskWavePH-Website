import type { TrackingQuery } from "@/features/applications/tracking";
import { ContentPage } from "@/components/layout/content-page";
import { PreviewJobApplication } from "@/components/jobs/job-preview";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const jobId = typeof query.jobId === "string" ? query.jobId : undefined;
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={query}
      eyebrow="Sample application"
      title="Try a role-specific application."
      description="This preview validates your entries without sending or saving them."
    >
      <PreviewJobApplication query={query} id={jobId} />
    </ContentPage>
  );
}
