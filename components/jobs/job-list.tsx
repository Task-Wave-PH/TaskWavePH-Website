"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  getApplyHref,
  getTrackedHref,
  getTracking,
  type TrackingQuery,
} from "@/features/applications/tracking";
import {
  serviceAreas,
  workArrangements,
  type JobView,
} from "@/features/jobs/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function JobList({
  jobs,
  query,
  filters = {},
  nextHref,
  unavailable = false,
  preview = false,
  onFilter,
  onMore,
}: {
  jobs: JobView[];
  query: TrackingQuery;
  filters?: { serviceArea?: string; arrangement?: string };
  nextHref?: string;
  unavailable?: boolean;
  preview?: boolean;
  onFilter?: (serviceArea: string, arrangement: string) => void;
  onMore?: () => void;
}) {
  const [serviceArea, setServiceArea] = useState(filters.serviceArea || "all");
  const [arrangement, setArrangement] = useState(filters.arrangement || "all");
  const router = useRouter();
  return (
    <section
      id="open-roles"
      aria-labelledby="roles-title"
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-semibold text-primary">
          Find your next opportunity
        </p>
        <h2 id="roles-title" className="mt-3 text-3xl font-semibold">
          Open roles
        </h2>
        <p className="mt-3 text-muted-foreground">
          Explore published opportunities and learn what each role involves.
        </p>
      </div>
      <form
        className="grid rounded-xl border bg-secondary/40 p-4 gap-4 sm:p-5 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,18rem)_minmax(0,18rem)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (onFilter) {
            onFilter(serviceArea, arrangement);
            return;
          }
          const params = new URLSearchParams(getTracking(query));
          params.delete("landing_page");
          if (serviceArea !== "all") params.set("serviceArea", serviceArea);
          if (arrangement !== "all") params.set("arrangement", arrangement);
          router.push(`/careers?${params}`);
        }}
      >
        {(
          [
            ["Service area", serviceArea, setServiceArea, serviceAreas],
            ["Work arrangement", arrangement, setArrangement, workArrangements],
          ] as const
        ).map(([label, value, setValue, options]) => (
          <div key={label} className="grid min-w-0 gap-2">
            <Label
              htmlFor={`job-filter-${label === "Service area" ? "service" : "arrangement"}`}
            >
              {label}
            </Label>
            <Select
              items={{
                all: `All ${label.toLowerCase()}s`,
                ...Object.fromEntries(
                  options.map((option) => [option, option]),
                ),
              }}
              value={value}
              onValueChange={(v) => setValue(v ?? "all")}
            >
              <SelectTrigger
                id={`job-filter-${label === "Service area" ? "service" : "arrangement"}`}
                aria-label={label}
                className="h-11! w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {label.toLowerCase()}s</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button
          type="submit"
          className="h-11 w-full px-5 sm:col-span-2 lg:col-span-1 lg:w-auto lg:justify-self-start"
        >
          Filter Roles
        </Button>
      </form>
      {unavailable ? (
        <p role="status" className="rounded-lg border p-6">
          We couldn’t load roles right now. Please try again later. You can
          still prepare a general application.
        </p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border bg-secondary/50 p-5 sm:p-6">
          <p role="status" className="font-medium text-brand-navy">
            No open roles{" "}
            {filters.serviceArea || filters.arrangement
              ? "match these filters"
              : "are listed right now"}
            .
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            You can prepare a general application. Submission is available when
            applications are open.
          </p>
          <Link
            href={getApplyHref(query)}
            className={buttonVariants({
              variant: "outline",
              className: "mt-4 min-h-11 w-full sm:w-auto",
            })}
          >
            General Application
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job._id} className="py-0">
              <CardContent className="flex flex-1 flex-col items-start gap-4 p-6">
                <p className="text-sm font-medium text-primary">
                  {job.serviceArea}
                </p>
                <h3 className="break-words text-xl font-semibold">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground">{job.location}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
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
                {job.salary && <p className="text-sm">{job.salary}</p>}
                <Link
                  href={getTrackedHref(
                    `${preview ? "/dev-preview/careers" : "/careers"}/${job._id}`,
                    query,
                  )}
                  className={buttonVariants({
                    variant: "outline",
                    className: "mt-auto min-h-11 px-5",
                  })}
                >
                  View Role<span className="sr-only">: {job.title}</span>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {nextHref && (
        <Link
          href={nextHref}
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11",
          })}
        >
          Next Page
        </Link>
      )}
      {onMore && (
        <Button variant="outline" onClick={onMore}>
          Load More Roles
        </Button>
      )}
    </section>
  );
}
