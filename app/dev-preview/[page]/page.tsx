import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocalHostname } from "@/lib/admin-host";
import { LoginForm } from "@/components/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PreviewDashboardContent } from "@/components/admin/preview-dashboard-content";
import { DashboardShell } from "@/components/admin/dashboard";

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
    <p className="rounded-lg border border-primary/20 bg-secondary p-4 text-sm">
      Local UI preview · Sample data only ·{" "}
      <Link
        className="text-primary underline"
        href={page === "login" ? "/dev-preview" : "/dev-preview/login"}
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
      <PreviewDashboardContent kind={kind} />
    </DashboardShell>
  );
}
