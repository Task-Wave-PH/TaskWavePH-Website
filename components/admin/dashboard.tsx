"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { ApplicantDetails } from "./applicant-details";
import { ExportButtons } from "./export-buttons";
import type { ApplicantView } from "@/features/applications/admin-types";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  FileText,
  Handshake,
  LayoutDashboard,
  BriefcaseBusiness,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { RecordsView } from "./records-view";
import { LeadDetails } from "./lead-details";
import { AccessDenied } from "./access-denied";
import { AccessLoading } from "./access-loading";
import type { LeadView } from "@/features/leads/admin-types";
import type { Id } from "@/convex/_generated/dataModel";
type Kind = "applications" | "businessLeads";
const title = (kind: Kind) =>
  kind === "applications" ? "Applications" : "Business Leads";
export function StaffGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/admin/sign-in");
  }, [isLoaded, isSignedIn, router]);
  if (isLoaded && !isSignedIn)
    return <AccessLoading message="Opening staff sign-in…" />;
  if (!isLoaded || isLoading) return <AccessLoading />;
  if (!isAuthenticated)
    return <AccessLoading message="Connecting to your staff workspace…" />;
  return <Access>{children}</Access>;
}
function Access({ children }: { children: React.ReactNode }) {
  const access = useQuery(api.staffStatus.current);
  const current = useQuery(
    api.staffManagement.current,
    access === true ? {} : "skip",
  );
  if (access === undefined)
    return <AccessLoading message="Checking permissions…" />;
  if (!access) return <AccessDenied />;
  if (current === undefined)
    return (
      <AccessLoading message="Checking your role and available features…" />
    );
  return children;
}
function Navigation({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Admin navigation" className="px-2 py-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={
              <Link
                href={preview ? "/dev-preview" : "/admin"}
                aria-current={
                  ["/admin", "/dev-preview", "/"].includes(pathname)
                    ? "page"
                    : undefined
                }
              />
            }
            isActive={["/admin", "/dev-preview", "/"].includes(pathname)}
            className="min-h-11"
            onClick={() => setOpenMobile(false)}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {(["applications", "businessLeads"] as const).map((kind) => (
          <SidebarMenuItem key={kind}>
            <SidebarMenuButton
              render={
                <Link
                  href={preview ? `/dev-preview/${kind}` : `/admin/${kind}`}
                  aria-current={pathname.includes(kind) ? "page" : undefined}
                />
              }
              isActive={pathname.includes(kind)}
              className="min-h-11 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
              onClick={() => setOpenMobile(false)}
            >
              {kind === "applications" ? <FileText /> : <Handshake />}
              {title(kind)}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            render={
              <Link
                href={preview ? "/dev-preview/jobs" : "/admin/jobs"}
                aria-current={pathname.includes("/jobs") ? "page" : undefined}
              />
            }
            isActive={pathname.includes("/jobs")}
            className="min-h-11"
            onClick={() => setOpenMobile(false)}
          >
            <BriefcaseBusiness />
            <span>Jobs</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {!preview && <OwnerNavigation />}
      </SidebarMenu>
    </nav>
  );
}
function OwnerNavigation() {
  const current = useQuery(api.staffManagement.current, {});
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  if (current?.role !== "Owner") return null;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href="/admin/users"
            aria-current={pathname.includes("/users") ? "page" : undefined}
          />
        }
        isActive={pathname.includes("/users")}
        className="min-h-11"
        onClick={() => setOpenMobile(false)}
      >
        <UsersRound />
        <span>Users</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
export function Dashboard({
  kind = "applications",
  id,
}: {
  kind?: Kind;
  id?: string;
}) {
  return (
    <StaffGate>
      <DashboardShell kind={kind}>
        {id ? (
          <Details kind={kind} id={id} />
        ) : (
          <Records key={kind} kind={kind} />
        )}
      </DashboardShell>
    </StaffGate>
  );
}
export function DashboardShell({
  sectionTitle,
  kind = "applications",
  preview = false,
  children,
}: {
  kind?: Kind;
  sectionTitle?: string;
  preview?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar preview={preview}>
        <Navigation preview={preview} />
      </AppSidebar>
      <SidebarInset className="min-w-0">
        <SiteHeader title={sectionTitle ?? title(kind)} preview={preview} />
        <div
          id="main-content"
          className="@container/main flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:py-8 lg:px-8"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Records({ kind }: { kind: Kind }) {
  const [status, setStatus] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [marking, setMarking] = useState(false);
  const prioritize = useMutation(api.admin.setPriority);
  const {
    results,
    status: pagination,
    loadMore,
  } = usePaginatedQuery(
    api.admin.list,
    {
      kind,
      ...(status ? { status } : {}),
      ...(priorityOnly ? { priorityOnly: true } : {}),
    },
    { initialNumItems: 20 },
  );
  return (
    <>
      <RecordsView
        kind={kind}
        rows={results}
        status={status}
        onStatus={setStatus}
        priorityOnly={priorityOnly}
        onPriorityFilter={setPriorityOnly}
        onPriority={
          kind === "businessLeads"
            ? async (row) => {
                if (marking) return;
                setMarking(true);
                setMessage("");
                try {
                  await prioritize({
                    id: row.id as Id<"businessLeads">,
                    priority: !row.priority,
                  });
                } catch {
                  setMessage(
                    "Unable to change priority. Check your access and try again.",
                  );
                } finally {
                  setMarking(false);
                }
              }
            : undefined
        }
        actions={
          kind === "applications" ? (
            <ExportButtons status={status} />
          ) : undefined
        }
        loading={pagination === "LoadingFirstPage"}
        loadingMore={pagination === "LoadingMore"}
        more={
          pagination === "CanLoadMore" || pagination === "LoadingMore"
            ? () => loadMore(20)
            : undefined
        }
      />
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </>
  );
}
function Details({ kind, id }: { kind: Kind; id: string }) {
  const record = useQuery(api.admin.detail, { kind, id });
  if (record === undefined) return <p role="status">Loading record…</p>;
  if (!record) return <p>Record not found.</p>;
  if (kind === "applications")
    return (
      <LiveApplicantEditor key={record._id} record={record as ApplicantView} />
    );
  return <LiveLeadEditor key={record._id} record={record as LeadView} />;
}
function LiveApplicantEditor({ record }: { record: ApplicantView }) {
  const update = useMutation(api.admin.update);
  const remove = useMutation(api.admin.remove);
  const router = useRouter();
  return (
    <ApplicantDetails
      record={record}
      backHref="/admin/applications"
      resumeUrl={
        record.resumeFile ? `/api/admin/resumes/${record._id}` : undefined
      }
      onSave={async (status, notes, expected) => {
        await update({
          kind: "applications",
          id: record._id,
          status,
          notes,
          expected,
        });
      }}
      onDelete={async () => {
        await remove({ kind: "applications", id: record._id });
        router.push("/admin/applications");
      }}
    />
  );
}
function LiveLeadEditor({ record }: { record: LeadView }) {
  const update = useMutation(api.admin.update),
    remove = useMutation(api.admin.remove),
    priority = useMutation(api.admin.setPriority);
  const router = useRouter();
  return (
    <LeadDetails
      record={record}
      backHref="/admin/businessLeads"
      onSave={async (status, notes, expected) => {
        await update({
          kind: "businessLeads",
          id: record._id,
          status,
          notes,
          expected,
        });
      }}
      onPriority={async (value) => {
        await priority({
          id: record._id as Id<"businessLeads">,
          priority: value,
        });
      }}
      onDelete={async () => {
        await remove({ kind: "businessLeads", id: record._id });
        router.push("/admin/businessLeads");
      }}
    />
  );
}
