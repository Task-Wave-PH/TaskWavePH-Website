"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePreviewJobs } from "./preview-provider";
import { JobEditor } from "./job-editor";
import { JobList } from "./job-list";
import { JobDetails } from "./job-details";
import { JobTable, JobStatusFilter } from "./job-admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApplicationForm } from "@/components/application/application-form";
import {
  getTracking,
  type TrackingQuery,
} from "@/features/applications/tracking";
export function PreviewNotice() {
  return (
    <p className="rounded-lg border bg-secondary p-4 text-sm">
      Local UI preview · Sample jobs only · Not actual vacancies · Changes reset
      on refresh.{" "}
      <Link href="/dev-preview/careers" className="text-primary underline">
        Preview Careers
      </Link>{" "}
      ·{" "}
      <Link href="/dev-preview/jobs" className="text-primary underline">
        Manage sample jobs
      </Link>{" "}
      ·{" "}
      <Link href="/careers" className="text-primary underline">
        View Careers Page
      </Link>
    </p>
  );
}
export function PreviewJobAdmin({ id }: { id?: string }) {
  const { jobs, save, setStatus } = usePreviewJobs();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(20);
  if (id) {
    const job = jobs.find((row) => row._id === id);
    if (id !== "new" && !job)
      return (
        <>
          <PreviewNotice />
          <p role="status">Posting not found. Sample data resets on refresh.</p>
        </>
      );
    return (
      <>
        <PreviewNotice />
        <JobEditor
          key={`${id}-${job?.updatedAt}`}
          preview
          job={job}
          onSave={async (data) => {
            const saved = save(data, job?._id);
            if (!job) router.push(`/dev-preview/jobs/${saved}`);
          }}
          onStatus={
            job
              ? async (status) => {
                  setStatus(job._id, status);
                }
              : undefined
          }
        />
      </>
    );
  }
  const filtered = jobs.filter(
    (row) => filter === "all" || row.status === filter,
  );
  return (
    <>
      <PreviewNotice />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Job Postings</h1>
        <Link href="/dev-preview/jobs/new" className={buttonVariants()}>
          Create Job
        </Link>
      </div>
      <JobStatusFilter
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setLimit(20);
        }}
      />
      {filtered.length ? (
        <JobTable jobs={filtered.slice(0, limit)} preview />
      ) : (
        <p role="status">No postings found.</p>
      )}
      {filtered.length > limit && (
        <Button onClick={() => setLimit((v) => v + 20)}>Load More</Button>
      )}
    </>
  );
}
export function PreviewCareers({ query = {} }: { query?: TrackingQuery }) {
  const { jobs } = usePreviewJobs();
  const [filters, setFilters] = useState({
    serviceArea: "all",
    arrangement: "all",
  });
  const [limit, setLimit] = useState(12);
  const filtered = jobs
    .filter(
      (j) =>
        j.status === "Published" &&
        (filters.serviceArea === "all" ||
          j.serviceArea === filters.serviceArea) &&
        (filters.arrangement === "all" ||
          j.arrangement === filters.arrangement),
    )
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return (
    <div className="space-y-8">
      <PreviewNotice />
      <JobList
        jobs={filtered.slice(0, limit)}
        query={query}
        preview
        filters={{
          serviceArea:
            filters.serviceArea === "all" ? undefined : filters.serviceArea,
          arrangement:
            filters.arrangement === "all" ? undefined : filters.arrangement,
        }}
        onFilter={(serviceArea, arrangement) => {
          setFilters({ serviceArea, arrangement });
          setLimit(12);
        }}
        onMore={
          filtered.length > limit ? () => setLimit((v) => v + 12) : undefined
        }
      />
    </div>
  );
}
export function PreviewJobDetail({ id }: { id: string }) {
  const { jobs } = usePreviewJobs();
  const job = jobs.find((row) => row._id === id && row.status === "Published");
  return (
    <div className="space-y-8">
      <PreviewNotice />
      {job ? (
        <>
          <h2 className="text-3xl font-semibold">{job.title}</h2>
          <JobDetails job={job} query={{}} preview />
        </>
      ) : (
        <p role="status">This sample role is no longer published.</p>
      )}
    </div>
  );
}
export function PreviewJobApplication({ id }: { id?: string }) {
  const { jobs } = usePreviewJobs();
  const job = jobs.find((row) => row._id === id && row.status === "Published");
  return (
    <div className="space-y-8">
      <PreviewNotice />
      <h2 className="text-3xl font-semibold">Sample Application</h2>
      {job ? (
        <ApplicationForm
          key={job._id}
          job={{ id: job._id, title: job.title }}
          tracking={getTracking({}, "/apply")}
          enabled={false}
        />
      ) : (
        <p role="status">
          Sample role unavailable. No information was submitted.
        </p>
      )}
    </div>
  );
}
