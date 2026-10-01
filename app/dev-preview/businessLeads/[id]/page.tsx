import { DashboardShell } from "@/components/admin/dashboard";
import { PreviewLeadDetails } from "@/components/admin/preview-dashboard-content";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell kind="businessLeads" preview>
      <PreviewLeadDetails id={id} />
    </DashboardShell>
  );
}
