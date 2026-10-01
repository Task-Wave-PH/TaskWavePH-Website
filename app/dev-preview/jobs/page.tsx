import { DashboardShell } from "@/components/admin/dashboard";
import { PreviewJobAdmin } from "@/components/jobs/job-preview";
export default function Page() {
  return (
    <DashboardShell sectionTitle="Jobs" preview>
      <PreviewJobAdmin />
    </DashboardShell>
  );
}
