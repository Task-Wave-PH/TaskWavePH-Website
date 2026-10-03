import type { TrackingQuery } from "@/features/applications/tracking";
import { ContentPage } from "@/components/layout/content-page";
import { PreviewJobDetail } from "@/components/jobs/job-preview";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<TrackingQuery>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={query}
      eyebrow="Sample role"
      title="Role preview"
      description="Not an actual vacancy."
    >
      <PreviewJobDetail id={id} query={query} />
    </ContentPage>
  );
}
