import type { TrackingQuery } from "@/features/applications/tracking";
import { ContentPage } from "@/components/layout/content-page";
import { PreviewJobApplication } from "@/components/jobs/job-preview";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<TrackingQuery>;
}) {
  const { slug } = await params;
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={await searchParams}
      eyebrow="Sample application"
      title="Try a role-specific application."
      description="Local sample only. No information is sent or saved."
    >
      <PreviewJobApplication id={slug} query={await searchParams} />
    </ContentPage>
  );
}
