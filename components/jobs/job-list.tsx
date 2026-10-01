"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
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
      className="scroll-mt-6 space-y-6"
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
        className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-end"
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
          <div key={label} className="min-w-0 space-y-2 sm:w-64">
            <Label>{label}</Label>
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
              <SelectTrigger aria-label={label} className="min-h-11 w-full">
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
        <Button type="submit" className="min-h-11">
          Filter Roles
        </Button>
      </form>
      {unavailable ? (
        <p role="status" className="rounded-lg border p-6">
          We couldn’t load roles right now. Please try again later. You can
          still prepare a general application.
        </p>
      ) : jobs.length === 0 ? (
        <p role="status" className="rounded-lg border bg-secondary p-6">
          No open roles{" "}
          {filters.serviceArea || filters.arrangement
            ? "match these filters"
            : "are listed right now"}
          . You can submit a general application when submissions are enabled.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-medium text-primary">
                  {job.serviceArea}
                </p>
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.location}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{job.arrangement}</Badge>
                  <Badge variant="outline">{job.employmentType}</Badge>
                </div>
                {job.salary && <p className="text-sm">{job.salary}</p>}
                <Link
                  href={getTrackedHref(
                    `${preview ? "/dev-preview/careers" : "/careers"}/${job._id}`,
                    query,
                  )}
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-11",
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
