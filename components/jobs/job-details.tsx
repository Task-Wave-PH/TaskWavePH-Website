import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { JobView } from "@/features/jobs/schema";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
export function JobDetails({
  job,
  query,
  preview = false,
}: {
  job: JobView;
  query: TrackingQuery;
  preview?: boolean;
}) {
  const apply = new URL(
    getTrackedHref(preview ? "/dev-preview/job-apply" : "/apply", query),
    "https://taskwaveph.com",
  );
  apply.searchParams.set("jobId", job._id);
  return (
    <div className="flex flex-col items-start gap-8">
      <Link
        href={getTrackedHref(
          preview ? "/dev-preview/careers" : "/careers",
          query,
        )}
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to careers
      </Link>
      <div className="flex flex-wrap gap-3">
        <Badge
          variant="secondary"
          className="h-auto min-h-7 px-3 py-1 whitespace-normal"
        >
          {job.serviceArea}
        </Badge>
        <Badge
          variant="outline"
          className="h-auto min-h-7 px-3 py-1 whitespace-normal"
        >
          {job.arrangement}
        </Badge>
        <Badge
          variant="outline"
          className="h-auto min-h-7 px-3 py-1 whitespace-normal"
        >
          {job.employmentType}
        </Badge>
      </div>
      <p>
        {job.location}
        {job.salary ? ` · ${job.salary}` : ""}
      </p>
      {[
        ["About the role", job.description],
        ["Responsibilities", job.responsibilities],
        ["Requirements", job.requirements],
      ].map(([title, text]) => (
        <section key={title} className="w-full min-w-0 max-w-3xl">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
            {text}
          </p>
        </section>
      ))}
      <Link
        href={apply.pathname + apply.search}
        className={buttonVariants({
          size: "lg",
          className: "min-h-12 w-full px-6 sm:w-auto",
        })}
      >
        Apply for This Role
      </Link>
      <p className="text-sm text-muted-foreground">
        Applying does not guarantee contact or employment. Our recruitment team
        will contact you if your profile matches an available opportunity.
      </p>
    </div>
  );
}
