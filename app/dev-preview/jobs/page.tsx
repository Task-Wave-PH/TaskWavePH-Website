import { DashboardShell } from "@/components/admin/dashboard";
import { PreviewJobAdmin } from "@/components/jobs/job-preview";
import { jobStatuses } from "@/features/jobs/schema";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const status = jobStatuses.find((value) => value === query.status) ?? "all";
  return (
    <DashboardShell sectionTitle="Jobs" preview>
      <PreviewJobAdmin initialStatus={status} />
    </DashboardShell>
  );
}
