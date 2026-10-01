"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  applicationStatuses,
  leadStatuses,
} from "@/features/submissions/validation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Handshake, LayoutDashboard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Kind = "applications" | "businessLeads";
const title = (kind: Kind) =>
  kind === "applications" ? "Applications" : "Business Leads";
function StaffGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isLoaded } = useAuth();
  if (!isLoaded || isLoading)
    return (
      <p className="p-8" role="status">
        Checking staff access…
      </p>
    );
  if (!isAuthenticated)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Staff sign-in</h1>
        <Link
          href="/admin/sign-in"
          className={buttonVariants({ className: "mt-5 min-h-11" })}
        >
          Sign in
        </Link>
      </main>
    );
  return <Access>{children}</Access>;
}
function Access({ children }: { children: React.ReactNode }) {
  const access = useQuery(api.staffStatus.current);
  if (access === undefined)
    return (
      <p className="p-8" role="status">
        Checking permissions…
      </p>
    );
  if (!access)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-4">Your account is not approved for staff access.</p>
        <UserButton />
      </main>
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
              <Link href={preview ? "/dev-preview/applications" : "/admin"} />
            }
            className="min-h-10"
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
                  aria-current={
                    pathname.includes(kind) ||
                    (kind === "applications" &&
                      ["/admin", "/"].includes(pathname))
                      ? "page"
                      : undefined
                  }
                />
              }
              isActive={
                pathname.includes(kind) ||
                (kind === "applications" && ["/admin", "/"].includes(pathname))
              }
              className="min-h-10 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
              onClick={() => setOpenMobile(false)}
            >
              {kind === "applications" ? <FileText /> : <Handshake />}
              {title(kind)}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
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
  kind = "applications",
  preview = false,
  children,
}: {
  kind?: Kind;
  preview?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar preview={preview}>
        <Navigation preview={preview} />
      </AppSidebar>
      <SidebarInset className="min-w-0">
        <SiteHeader title={`${title(kind)}`} />
        <div
          id="main-content"
          className="@container/main flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Records({ kind }: { kind: Kind }) {
  const [status, setStatus] = useState("");
  const {
    results,
    status: pagination,
    loadMore,
  } = usePaginatedQuery(
    api.admin.list,
    { kind, ...(status ? { status } : {}) },
    { initialNumItems: 20 },
  );
  return (
    <>
      <h1 className="sr-only">{title(kind)}</h1>
      <SectionCards
        rows={results}
        loading={pagination === "LoadingFirstPage"}
      />
      <ChartAreaInteractive
        rows={results}
        loading={pagination === "LoadingFirstPage"}
      />
      <Tabs
        value={status || "all"}
        onValueChange={(v) => setStatus(v === "all" ? "" : String(v))}
        className="gap-4"
      >
        <section aria-label="Records" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="hidden md:inline-flex">
              <TabsTrigger value="all">All records</TabsTrigger>
              {(kind === "applications"
                ? applicationStatuses
                : leadStatuses
              ).map((v) => (
                <TabsTrigger key={v} value={v}>
                  {v}
                </TabsTrigger>
              ))}
            </TabsList>
            <h2 className="text-lg font-semibold md:sr-only">{title(kind)}</h2>
            <div className="flex items-center gap-3">
              <Label htmlFor="status-filter" className="text-sm">
                Filter by status
              </Label>
              <Select
                value={status || "all"}
                onValueChange={(value) =>
                  setStatus(value === "all" ? "" : String(value))
                }
              >
                <SelectTrigger id="status-filter" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(kind === "applications"
                    ? applicationStatuses
                    : leadStatuses
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <TabsContent value={status || "all"} className="space-y-4">
            {pagination === "LoadingFirstPage" && (
              <p role="status">Loading records…</p>
            )}
            {pagination !== "LoadingFirstPage" && !results.length && (
              <p>No records found.</p>
            )}
            {!!results.length && (
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
                    {results.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            href={`/admin/${kind}/${row.id}`}
                            className="font-semibold text-primary underline underline-offset-4"
                          >
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          {new Date(row.submittedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          {pagination === "CanLoadMore" && (
            <Button className="mt-6 min-h-11" onClick={() => loadMore(20)}>
              Load more
            </Button>
          )}
          {pagination === "LoadingMore" && <p role="status">Loading more…</p>}
        </section>
      </Tabs>
    </>
  );
}
function Details({ kind, id }: { kind: Kind; id: string }) {
  const record = useQuery(api.admin.detail, { kind, id });
  if (record === undefined) return <p role="status">Loading record…</p>;
  if (!record) return <p>Record not found.</p>;
  return <Editor key={record._id} kind={kind} record={record} />;
}
type RecordData = NonNullable<
  import("convex/server").FunctionReturnType<typeof api.admin.detail>
>;
function Editor({ kind, record }: { kind: Kind; record: RecordData }) {
  const [status, setStatus] = useState<string>(record.status);
  const [notes, setNotes] = useState(record.notes);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const update = useMutation(api.admin.update);
  const remove = useMutation(api.admin.remove);
  const router = useRouter();
  const resume = "resumeFile" in record ? record.resumeFile : undefined;
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await update({ kind, id: record._id, status, notes });
      setMessage("Changes saved.");
    } catch {
      setMessage("Unable to save. Check your access and try again.");
    } finally {
      setBusy(false);
    }
  }
  async function erase() {
    setBusy(true);
    try {
      await remove({ kind, id: record._id });
      router.push(`/admin/${kind}`);
    } catch {
      setMessage("Unable to delete. Check your access and try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <Link href={`/admin/${kind}`} className="text-primary underline">
        Back to {title(kind)}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">
        {kind === "applications" && "firstName" in record.data
          ? `${record.data.firstName} ${record.data.lastName}`
          : "company" in record.data
            ? record.data.company
            : "Record"}
      </h1>
      <p className="mt-3 break-all text-sm text-muted-foreground">
        {record.reference}
      </p>
      <Card className="mt-6">
        <CardContent className="p-5 sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            {Object.entries(record.data).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="text-sm font-medium">
                  {key.replace(/([A-Z])/g, " $1").replaceAll("_", " ")}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                  {Array.isArray(value)
                    ? value.join(", ")
                    : String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
          {resume && (
            <Link
              prefetch={false}
              href={`/api/admin/resumes/${record._id}`}
              className={buttonVariants({ className: "mt-6 min-h-11" })}
            >
              Download resume PDF
            </Link>
          )}
        </CardContent>
      </Card>
      <div className="mt-8 space-y-4">
        <Label htmlFor="record-status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(String(value))}
        >
          <SelectTrigger id="record-status" className="min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(kind === "applications" ? applicationStatuses : leadStatuses).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
        <Button className="min-h-11" disabled={busy} onClick={save}>
          {busy ? "Please wait…" : "Save changes"}
        </Button>
        <p role="status">{message}</p>
        <Button
          variant="destructive"
          className="min-h-11"
          disabled={busy}
          onClick={() => setConfirm(true)}
        >
          Delete record
        </Button>
        {confirm && (
          <Card>
            <CardContent className="space-y-4 p-5">
              <p>
                Permanently delete this record and any attached resume? This
                cannot be undone.
              </p>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={erase}
                className="min-h-11"
              >
                Confirm permanent deletion
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirm(false)}
                className="ml-3 min-h-11"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
