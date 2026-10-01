import { DashboardShell } from "@/components/admin/dashboard";
import { PreviewApplicantDetails } from "@/components/admin/preview-applicant-details";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell preview>
      <PreviewApplicantDetails id={id} />
    </DashboardShell>
  );
}
