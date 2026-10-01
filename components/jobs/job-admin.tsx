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
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
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
                  className="font-medium text-primary underline"
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
      <SelectTrigger aria-label="Posting status" className="min-h-11 w-48">
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
function LiveList() {
  const [filter, setFilter] = useState("all");
  const { results, status, loadMore } = usePaginatedQuery(
    api.jobs.staffList,
    { ...(filter !== "all" ? { status: filter as JobStatus } : {}) },
    { initialNumItems: 20 },
  );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Job Postings</h1>
        <Link href="/admin/jobs/new" className={buttonVariants()}>
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
        <Button variant="outline" onClick={() => loadMore(20)}>
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
  if (id !== "new" && job === undefined)
    return <p role="status">Loading posting…</p>;
  if (id !== "new" && !job) return <p role="status">Posting not found.</p>;
  return (
    <JobEditor
      key={`${job?._id}-${job?.updatedAt}`}
      job={job ?? undefined}
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
export function JobAdmin({ id }: { id?: string }) {
  return (
    <StaffGate>
      <DashboardShell sectionTitle="Jobs">
        {id ? <LiveEditor id={id} /> : <LiveList />}
      </DashboardShell>
    </StaffGate>
  );
}
