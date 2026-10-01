import { ContentPage } from "@/components/layout/content-page";
import { PreviewJobDetail } from "@/components/jobs/job-preview";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={{}}
      eyebrow="Sample role"
      title="Role preview"
      description="Not an actual vacancy."
    >
      <PreviewJobDetail id={id} />
    </ContentPage>
  );
}
