import { JobAdmin } from "@/components/jobs/job-admin";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobAdmin id={id} />;
}
