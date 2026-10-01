import { Dashboard } from "@/components/admin/dashboard";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (kind !== "applications" && kind !== "businessLeads") notFound();
  return <Dashboard kind={kind} id={id} />;
}
