"use client";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applicationStatuses,
  leadStatuses,
} from "@/features/submissions/validation";
import { formatAdminDate } from "@/features/admin/metrics";
export type RecordSummary = {
  id: string;
  reference: string;
  name: string;
  email: string;
  status: string;
  submittedAt: number;
  priority?: boolean;
  source?: string;
  campaign?: string;
  jobTitle?: string;
};
export function RecordsView({
  kind,
  rows,
  status,
  onStatus,
  priorityOnly = false,
  onPriorityFilter,
  onPriority,
  actions,
  filters,
  loading,
  more,
  loadingMore,
  preview = false,
  matchedCount,
}: {
  kind: "applications" | "businessLeads";
  rows: RecordSummary[];
  status: string;
  onStatus: (status: string) => void;
  priorityOnly?: boolean;
  onPriorityFilter?: (value: boolean) => void;
  onPriority?: (row: RecordSummary) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  loading?: boolean;
  more?: () => void;
  loadingMore?: boolean;
  preview?: boolean;
  matchedCount?: number;
}) {
  const leads = kind === "businessLeads",
    title = leads ? "Business Leads" : "Applications";
  const root = preview ? "/dev-preview" : "/admin";
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {leads
            ? "Review business enquiries, mark priority contacts, and track follow-up."
            : "Review applicant profiles, view CVs, and track recruitment progress."}
        </p>
      </div>
      {filters ?? (
        <Card className="py-0">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="status-filter">Filter by status</Label>
                <Select
                  value={status || "all"}
                  onValueChange={(v) => onStatus(v === "all" ? "" : String(v))}
                >
                  <SelectTrigger
                    id="status-filter"
                    className="h-11! w-full sm:w-48"
                  >
                    <SelectValue>{status || "All statuses"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(leads ? leadStatuses : applicationStatuses).map(
                      (value) => (
                        <SelectItem value={value} key={value}>
                          {value}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              {leads && onPriorityFilter && (
                <Button
                  className="min-h-11 px-4"
                  variant={priorityOnly ? "secondary" : "outline"}
                  aria-pressed={priorityOnly}
                  onClick={() => onPriorityFilter(!priorityOnly)}
                >
                  <Star
                    className={priorityOnly ? "fill-primary text-primary" : ""}
                  />
                  Priority only
                </Button>
              )}
            </div>
            {actions}
          </CardContent>
        </Card>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
        >
          Loading records…
        </p>
      ) : !rows.length ? (
        <div
          role="status"
          className="space-y-2 rounded-xl border bg-card p-8 text-center"
        >
          <p className="font-medium">No records found.</p>
          <p className="text-sm text-muted-foreground">
            {status || priorityOnly
              ? "Try another filter to see more records."
              : "New submissions will appear here after they are saved."}
          </p>
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                {leads && (
                  <TableHead className="w-16">
                    <span className="sr-only">Priority</span>
                  </TableHead>
                )}
                <TableHead>{leads ? "Company" : "Applicant"}</TableHead>
                <TableHead>Email</TableHead>
                {!leads && (
                  <>
                    <TableHead>Role</TableHead>
                    <TableHead>Source / campaign</TableHead>
                  </>
                )}
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {leads && (
                    <TableCell>
                      {onPriority ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={`${row.priority ? "Unmark" : "Mark"} ${row.name} as priority`}
                          aria-pressed={row.priority ?? false}
                          onClick={() => onPriority(row)}
                        >
                          <Star
                            className={
                              row.priority
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }
                          />
                        </Button>
                      ) : row.priority ? (
                        <Star
                          className="size-4 fill-primary text-primary"
                          aria-label="Priority lead"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  )}
                  <TableCell className="max-w-64 whitespace-normal">
                    <Link
                      href={`${root}/${kind}/${row.id}`}
                      className="inline-flex min-h-11 items-center break-words font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  {!leads && (
                    <>
                      <TableCell className="max-w-48 whitespace-normal">
                        {row.jobTitle || "General application"}
                      </TableCell>
                      <TableCell className="max-w-56 whitespace-normal break-words">
                        <span className="block">
                          {row.source || "Unattributed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.campaign || "No campaign"}
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>{formatAdminDate(row.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="px-2.5 py-1">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${root}/${kind}/${row.id}`}
                      className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary"
                    >
                      View<span className="sr-only"> {row.name}</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {!loading &&
            `Showing ${rows.length}${matchedCount !== undefined ? ` of ${matchedCount}` : ""} ${preview ? "sample " : ""}records.`}
        </p>
        {more && (
          <Button
            className="min-h-11 px-5"
            variant="outline"
            disabled={loadingMore}
            onClick={more}
          >
            {loadingMore ? "Loading more…" : "Load more"}
          </Button>
        )}
      </div>
    </>
  );
}
