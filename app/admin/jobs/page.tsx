import { JobAdmin } from "@/components/jobs/job-admin";
import { jobStatuses } from "@/features/jobs/schema";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const status = jobStatuses.find((value) => value === query.status) ?? "all";
  return <JobAdmin initialStatus={status} />;
}
