import { ContentPage } from "@/components/layout/content-page";
import { PreviewJobApplication } from "@/components/jobs/job-preview";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={{}}
      eyebrow="Sample application"
      title="Try a role-specific application."
      description="This preview validates your entries without sending or saving them."
    >
      <PreviewJobApplication id={jobId} />
    </ContentPage>
  );
}
