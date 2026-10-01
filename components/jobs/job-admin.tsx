"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StaffGate, DashboardShell } from "@/components/admin/dashboard";
import { JobEditor } from "./job-editor";
import {
  jobStatuses,
  type JobView,
  type JobStatus,
} from "@/features/jobs/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
export function JobTable({
  jobs,
  preview = false,
}: {
  jobs: JobView[];
  preview?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Work Arrangement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job._id}>
              <TableCell>
                <Link
                  href={`${preview ? "/dev-preview/jobs" : "/admin/jobs"}/${job._id}`}
                  className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                >
                  {job.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{job.status}</Badge>
              </TableCell>
              <TableCell>{job.location}</TableCell>
              <TableCell>{job.arrangement}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export function JobStatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={{
        all: "All statuses",
        ...Object.fromEntries(jobStatuses.map((status) => [status, status])),
      }}
      value={value}
      onValueChange={(v) => onChange(v ?? "all")}
    >
      <SelectTrigger
        aria-label="Posting status"
        className="h-11! w-full sm:w-48"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {jobStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function LiveList({ initialStatus }: { initialStatus: string }) {
  const [filter, setFilter] = useState(initialStatus);
  const { results, status, loadMore } = usePaginatedQuery(
    api.jobs.staffList,
    { ...(filter !== "all" ? { status: filter as JobStatus } : {}) },
    { initialNumItems: 20 },
  );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
            Job Postings
          </h1>
          <p className="text-sm text-muted-foreground">
            Prepare roles, manage publication, and archive completed hiring.
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className={buttonVariants({ className: "min-h-11 px-5" })}
        >
          Create Job
        </Link>
      </div>
      <JobStatusFilter value={filter} onChange={setFilter} />
      {status === "LoadingFirstPage" ? (
        <p role="status">Loading jobs…</p>
      ) : results.length ? (
        <JobTable jobs={results} />
      ) : (
        <p role="status">No postings found. Create a draft to get started.</p>
      )}
      {status === "CanLoadMore" && (
        <Button
          className="min-h-11 self-start px-5"
          variant="outline"
          onClick={() => loadMore(20)}
        >
          Load More
        </Button>
      )}
    </>
  );
}
function LiveEditor({ id }: { id: string }) {
  const router = useRouter();
  const job = useQuery(
    api.jobs.staffDetail,
    id === "new" ? "skip" : { id: id as Id<"jobs"> },
  );
  const save = useMutation(api.jobs.save);
  const setStatus = useMutation(api.jobs.setStatus);
  const remove = useMutation(api.jobs.remove);
  const canDelete = useQuery(
    api.jobs.deletionAllowed,
    job ? { id: job._id } : "skip",
  );
  if (id !== "new" && job === undefined)
    return <p role="status">Loading posting…</p>;
  if (id !== "new" && !job) return <p role="status">Posting not found.</p>;
  return (
    <JobEditor
      key={`${job?._id}-${job?.updatedAt}`}
      job={job ?? undefined}
      deletionAllowed={canDelete}
      onDelete={
        job
          ? async () => {
              await remove({ id: job._id });
              router.push("/admin/jobs");
            }
          : undefined
      }
      onSave={async (data) => {
        const saved = await save({ data, ...(job ? { id: job._id } : {}) });
        if (!job) router.push(`/admin/jobs/${saved}`);
      }}
      onStatus={
        job
          ? async (status) => {
              await setStatus({ id: job._id, status });
            }
          : undefined
      }
    />
  );
}
export function JobAdmin({
  id,
  initialStatus = "all",
}: {
  id?: string;
  initialStatus?: string;
}) {
  return (
    <StaffGate>
      <DashboardShell sectionTitle="Jobs">
        {id ? (
          <LiveEditor id={id} />
        ) : (
          <LiveList initialStatus={initialStatus} />
        )}
      </DashboardShell>
    </StaffGate>
  );
}
