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
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
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
function Navigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Admin navigation" className="p-3">
      <SidebarMenu>
        {(["applications", "businessLeads"] as const).map((kind) => (
          <SidebarMenuItem key={kind}>
            <SidebarMenuButton
              render={
                <Link
                  href={`/admin/${kind}`}
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
              className="min-h-12 data-active:bg-primary data-active:text-white"
              onClick={() => setOpenMobile(false)}
            >
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
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b p-5">
            <BrandLogo />
          </SidebarHeader>
          <SidebarContent>
            <Navigation />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <SidebarTrigger className="size-11" />
            <p className="font-medium text-brand-navy">
              TaskWavePH Administration
            </p>
            <UserButton />
          </header>
          <div id="main-content" className="min-w-0 flex-1 p-5 sm:p-8">
            {id ? (
              <Details kind={kind} id={id} />
            ) : (
              <Records key={kind} kind={kind} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StaffGate>
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
      <h1 className="text-3xl font-semibold">{title(kind)}</h1>
      <Label htmlFor="status-filter" className="mt-6 mb-2 block">
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
          {(kind === "applications" ? applicationStatuses : leadStatuses).map(
            (value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
      <div className="mt-6 space-y-4">
        {pagination === "LoadingFirstPage" && (
          <p role="status">Loading records…</p>
        )}
        {pagination !== "LoadingFirstPage" && !results.length && (
          <p>No records found.</p>
        )}
        {results.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <Link
                  href={`/admin/${kind}/${row.id}`}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {row.name}
                </Link>
                <p className="mt-2 break-all text-muted-foreground">
                  {row.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.submittedAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-2 text-sm font-medium">
                {row.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      {pagination === "CanLoadMore" && (
        <Button className="mt-6 min-h-11" onClick={() => loadMore(20)}>
          Load more
        </Button>
      )}
      {pagination === "LoadingMore" && <p role="status">Loading more…</p>}
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
