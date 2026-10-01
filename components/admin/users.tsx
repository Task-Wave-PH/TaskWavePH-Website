"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailPlus, UsersRound, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { StaffGate, DashboardShell } from "./dashboard";
import { AccessLoading } from "./access-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
type Role = "Owner" | "Staff";
type Staff = FunctionReturnType<
  typeof api.staffManagement.list
>["page"][number];
type Invitation = FunctionReturnType<
  typeof api.staffManagement.invitations
>["page"][number];
const schema = z.object({
  email: z.email().max(254),
  role: z.enum(["Owner", "Staff"]),
});
function message(error: unknown) {
  const code =
    error instanceof ConvexError && typeof error.data === "string"
      ? error.data
      : "";
  const messages: Record<string, string> = {
    LAST_OWNER:
      "Keep at least one active owner. Promote another staff member first.",
    OWNER_REQUIRED: "Only an active owner can manage users.",
    EDIT_CONFLICT:
      "This account changed. Review the updated row and try again.",
    INVITATION_EXISTS: "An invitation is already pending for this email.",
    ACCOUNT_EXISTS:
      "This staff account already exists. Update its access below.",
    INVITATION_IN_PROGRESS:
      "This invitation is still being sent. Wait a minute, then try again.",
    RATE_LIMITED: "Too many invitation attempts. Please try again later.",
    INVITATION_UNAVAILABLE:
      "This invitation is no longer available. Refresh and review its status.",
    CLERK_UNAVAILABLE:
      "The account service is unavailable. The operation may be incomplete; use Retry rather than creating a duplicate invitation.",
    INVITATIONS_NOT_CONFIGURED:
      "Invitation delivery is not configured. Ask the project owner to complete backend setup.",
    CLERK_NOT_CONFIGURED: "Clerk is not configured in the backend.",
  };
  return (
    messages[code] ??
    "Unable to complete this change. Check your access and try again."
  );
}
function Choice({
  label,
  value,
  values,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(value) => {
        if (value) onChange(value);
      }}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className="min-h-11 w-full sm:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function UsersPage() {
  return (
    <StaffGate>
      <OwnerGate />
    </StaffGate>
  );
}
function OwnerGate() {
  const current = useQuery(api.staffManagement.current, {});
  if (!current) return <AccessLoading message="Checking owner access…" />;
  return (
    <DashboardShell sectionTitle="Users">
      {current.role === "Owner" ? (
        <UsersContent />
      ) : (
        <Card>
          <CardContent className="space-y-4 py-6">
            <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-brand-navy">
              Owner access required
            </h1>
            <p className="text-muted-foreground">
              Only owners can invite staff and manage account permissions.
            </p>
            <Link
              href="/admin"
              className={buttonVariants({ className: "min-h-11 px-5" })}
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
function UsersContent() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [filter, setFilter] = useState("All staff"),
    [inviteFilter, setInviteFilter] = useState("All invitations");
  const staff = usePaginatedQuery(
    api.staffManagement.list,
    filter === "All staff" ? {} : { active: filter === "Active" },
    { initialNumItems: 20 },
  );
  const invitations = usePaginatedQuery(
    api.staffManagement.invitations,
    inviteFilter === "All invitations"
      ? {}
      : { status: inviteFilter as Invitation["status"] },
    { initialNumItems: 20 },
  );
  const invite = useAction(api.staffInvitations.invite),
    revoke = useAction(api.staffInvitations.revoke),
    retry = useAction(api.staffInvitations.retry),
    update = useMutation(api.staffManagement.update);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(false);
  const [confirm, setConfirm] = useState<
    | { kind: "staff"; staff: Staff; active: boolean; role: Role }
    | { kind: "revoke"; invitation: Invitation }
    | null
  >(null);
  const token = useRef<{ fingerprint: string; value: string } | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "Staff" },
  });
  const inviteRole = useWatch({ control: form.control, name: "role" });
  async function perform(operation: () => Promise<unknown>, success: string) {
    setBusy(true);
    setNotice("");
    setFailure(false);
    try {
      await operation();
      setNotice(success);
      return true;
    } catch (error) {
      setNotice(message(error));
      setFailure(true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function send(data: z.infer<typeof schema>) {
    const email = data.email.trim().toLowerCase();
    const fingerprint = JSON.stringify([email, data.role]);
    if (token.current?.fingerprint !== fingerprint)
      token.current = { fingerprint, value: crypto.randomUUID() };
    if (
      await perform(
        () => invite({ email, role: data.role, token: token.current!.value }),
        "Invitation sent. Access activates after the recipient accepts it.",
      )
    ) {
      form.reset();
      token.current = null;
    }
  }
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
          Manage your team
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Invite staff, choose their role, and manage workspace access. Only
          owners can change permissions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus aria-hidden="true" className="size-5 text-primary" />
            Invite a staff member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => void form.handleSubmit(send)(event)}
            className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="off"
                placeholder="staff@example.com"
                className="min-h-11"
                disabled={busy}
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={
                  form.formState.errors.email ? "staff-email-error" : undefined
                }
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p
                  id="staff-email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  Enter a valid email address.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Choice
                label="Invitation role"
                value={inviteRole}
                values={["Staff", "Owner"]}
                onChange={(value) => form.setValue("role", value as Role)}
                disabled={busy}
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="min-h-11 px-5 md:mt-6"
            >
              {busy ? "Please wait…" : "Send invitation"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground md:col-span-3">
              Staff manage applications, business leads, and jobs. Owners can
              also manage users. Invitations expire after seven days.
            </p>
          </form>
        </CardContent>
      </Card>
      {notice && (
        <p
          role={failure ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm leading-6 ${failure ? "border-destructive/20 text-destructive" : "border-primary/20 bg-secondary text-brand-navy"}`}
        >
          {notice}
        </p>
      )}
      <Tabs defaultValue="staff">
        <TabsList className="mb-4">
          <TabsTrigger value="staff">
            <UsersRound aria-hidden="true" className="size-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <Card>
            <CardHeader className="gap-4 sm:flex sm:items-center sm:justify-between">
              <CardTitle>Staff access</CardTitle>
              <Choice
                label="Filter staff access"
                value={filter}
                values={["All staff", "Active", "Inactive"]}
                onChange={setFilter}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {staff.status === "LoadingFirstPage" ? (
                <p role="status">Loading staff…</p>
              ) : staff.results.length === 0 ? (
                <p className="py-6 text-muted-foreground">
                  No staff match this filter.
                </p>
              ) : (
                staff.results.map((row) => (
                  <div
                    key={row.id}
                    className="flex min-w-0 flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-words font-medium text-brand-navy">
                        {row.name || row.email || "Staff account"}
                      </p>
                      <p className="break-all text-sm text-muted-foreground">
                        {row.email || row.subject}
                      </p>
                      <Badge variant="outline">
                        {row.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Choice
                      label={`Role for ${row.email || row.subject}`}
                      value={row.role}
                      values={["Staff", "Owner"]}
                      disabled={busy}
                      onChange={(role) =>
                        setConfirm({
                          kind: "staff",
                          staff: row,
                          role: role as Role,
                          active: row.active,
                        })
                      }
                    />
                    <Button
                      variant="outline"
                      className="min-h-11 px-4"
                      disabled={busy}
                      onClick={() =>
                        setConfirm({
                          kind: "staff",
                          staff: row,
                          role: row.role,
                          active: !row.active,
                        })
                      }
                    >
                      {row.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                ))
              )}
              {staff.status === "CanLoadMore" && (
                <Button
                  className="min-h-11"
                  variant="outline"
                  onClick={() => staff.loadMore(20)}
                >
                  Load more staff
                </Button>
              )}
              {staff.status === "LoadingMore" && (
                <p role="status">Loading more staff…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invitations">
          <Card>
            <CardHeader className="gap-4 sm:flex sm:items-center sm:justify-between">
              <CardTitle>Staff invitations</CardTitle>
              <Choice
                label="Filter invitations"
                value={inviteFilter}
                values={[
                  "All invitations",
                  "Pending",
                  "Sending",
                  "Accepted",
                  "Revoked",
                  "Failed",
                ]}
                onChange={setInviteFilter}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {invitations.status === "LoadingFirstPage" ? (
                <p role="status">Loading invitations…</p>
              ) : invitations.results.length === 0 ? (
                <p className="py-6 text-muted-foreground">
                  No invitations match this filter.
                </p>
              ) : (
                invitations.results.map((row) => {
                  const expired =
                    row.expiresAt < now &&
                    ["Pending", "Sending", "Failed"].includes(row.status);
                  return (
                    <div
                      key={row.id}
                      className="flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="break-all font-medium text-brand-navy">
                          {row.email}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{row.role}</Badge>
                          <Badge variant="outline">
                            {expired ? "Expired" : row.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expires{" "}
                          {new Date(row.expiresAt).toLocaleDateString("en-PH")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!expired &&
                          ["Failed", "Sending"].includes(row.status) && (
                            <Button
                              variant="outline"
                              className="min-h-11"
                              disabled={busy}
                              onClick={() =>
                                void perform(
                                  () => retry({ id: row.id }),
                                  "Invitation delivery completed.",
                                )
                              }
                            >
                              Retry delivery
                            </Button>
                          )}
                        {row.status !== "Accepted" && (
                          <Button
                            variant="outline"
                            className="min-h-11"
                            disabled={busy}
                            onClick={() =>
                              setConfirm({ kind: "revoke", invitation: row })
                            }
                          >
                            {row.status === "Revoked"
                              ? "Retry cancellation"
                              : "Cancel invitation"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {invitations.status === "CanLoadMore" && (
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => invitations.loadMore(20)}
                >
                  Load more invitations
                </Button>
              )}
              {invitations.status === "LoadingMore" && (
                <p role="status">Loading more invitations…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Sheet
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {confirm?.kind === "revoke"
                ? "Cancel this invitation?"
                : "Update staff access?"}
            </SheetTitle>
            <SheetDescription>
              {confirm?.kind === "revoke"
                ? "This invitation will stop granting workspace access. The account service may need a retry if it is unavailable."
                : "Changes apply immediately. Deactivated accounts lose record access; their Clerk account and audit history remain."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-6 text-sm">
            <p className="break-all font-medium">
              {confirm?.kind === "revoke"
                ? confirm.invitation.email
                : confirm?.staff.email || confirm?.staff.subject}
            </p>
            {confirm?.kind === "staff" && (
              <p>
                {confirm.active ? "Active" : "Inactive"} · {confirm.role}
              </p>
            )}
            {failure && notice && (
              <p role="alert" className="text-destructive">
                {notice}
              </p>
            )}
          </div>
          <SheetFooter>
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={async () => {
                if (!confirm) return;
                const ok = await perform(
                  () =>
                    confirm.kind === "revoke"
                      ? revoke({ id: confirm.invitation.id })
                      : update({
                          id: confirm.staff.id,
                          active: confirm.active,
                          role: confirm.role,
                          expectedRevision: confirm.staff.revision,
                        }),
                  confirm.kind === "revoke"
                    ? "Invitation cancelled."
                    : "Staff access updated.",
                );
                if (ok) setConfirm(null);
              }}
            >
              {busy ? "Saving…" : "Confirm change"}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Keep unchanged
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
