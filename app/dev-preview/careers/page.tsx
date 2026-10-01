import { ContentPage } from "@/components/layout/content-page";
import { PreviewCareers } from "@/components/jobs/job-preview";
export default function Page() {
  return (
    <ContentPage
      audience="applicant"
      showCta={false}
      query={{}}
      eyebrow="Sample Careers"
      title="Explore sample roles."
      description="Local UI preview only. These are not real vacancies."
    >
      <PreviewCareers />
    </ContentPage>
  );
}
