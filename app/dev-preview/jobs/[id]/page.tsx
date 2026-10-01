import { DashboardShell } from "@/components/admin/dashboard";
import { PreviewJobAdmin } from "@/components/jobs/job-preview";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell sectionTitle="Jobs" preview>
      <PreviewJobAdmin id={id} />
    </DashboardShell>
  );
}
