import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocalHostname } from "@/lib/admin-host";
import { LoginForm } from "@/components/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardShell } from "@/components/admin/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Local UI preview",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const host = (await headers()).get("host") ?? "";
  let local = false;
  try {
    local = isLocalHostname(new URL(`http://${host}`).hostname);
  } catch {}
  if (!local) notFound();
  const { page } = await params;
  if (!["login", "applications", "businessLeads"].includes(page)) notFound();
  const notice = (
    <p className="mb-6 rounded-lg border border-primary/20 bg-secondary p-4 text-sm">
      Local UI preview · Sample data only ·{" "}
      <Link
        className="text-primary underline"
        href={
          page === "login" ? "/dev-preview/applications" : "/dev-preview/login"
        }
      >
        {page === "login" ? "View dashboard" : "View login"}
      </Link>
    </p>
  );
  if (page === "login")
    return (
      <main
        id="main-content"
        className="flex min-h-svh flex-col items-center justify-center bg-secondary/50 p-5 md:p-10"
      >
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="self-center">
            <BrandLogo eager />
          </div>
          {notice}
          <LoginForm preview />
        </div>
      </main>
    );
  const kind = page === "businessLeads" ? "businessLeads" : "applications";
  return (
    <DashboardShell kind={kind} preview>
      {notice}
      <h1 className="mb-6 text-3xl font-semibold">
        {kind === "applications" ? "Applications" : "Business Leads"}
      </h1>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {["New", "Reviewed", "Closed"].map((status, index) => (
              <TableRow key={status}>
                <TableCell>
                  {kind === "applications"
                    ? `Sample applicant ${index + 1}`
                    : `Sample business ${index + 1}`}
                </TableCell>
                <TableCell>sample-{index + 1}@example.invalid</TableCell>
                <TableCell>1 Oct 2026</TableCell>
                <TableCell>
                  <span className="rounded-full bg-secondary px-3 py-1">
                    {kind === "businessLeads" && status === "Reviewed"
                      ? "Contacted"
                      : status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  );
}
