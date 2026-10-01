"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardShell, StaffGate } from "./dashboard";
import { usePreviewApplicants, usePreviewLeads } from "./preview-provider";
import { usePreviewJobs } from "@/components/jobs/preview-provider";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  manilaDay,
  previewOverview,
  formatAdminDate,
  total,
  type OverviewData,
  type StatusCount,
} from "@/features/admin/metrics";
export function useOverviewPeriod() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [day, setDay] = useState(() => manilaDay(Date.now()));
  useEffect(() => {
    const timer = setInterval(() => setDay(manilaDay(Date.now())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return { days, day, setDays };
}
function Breakdown({
  title,
  counts,
  loading,
}: {
  title: string;
  counts: StatusCount[];
  loading: boolean;
}) {
  const max = Math.max(1, ...counts.map((row) => row.count));
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {loading
            ? "Preparing totals…"
            : `${total(counts).toLocaleString()} total records`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {counts.map((row) => (
          <div key={row.status} className="space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span>{row.status}</span>
              <span className="font-medium tabular-nums">
                {row.count.toLocaleString()}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
function OverviewContent({
  data,
  days,
  onRange,
  preview = false,
}: {
  data?: OverviewData;
  days: 7 | 30 | 90;
  onRange: (days: 7 | 30 | 90) => void;
  preview?: boolean;
}) {
  const root = preview ? "/dev-preview" : "/admin";
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
              Dashboard
            </h1>
            {preview && <Badge variant="outline">Sample data</Badge>}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            An overview of applicants, business enquiries, and the roles your
            team manages.
          </p>
        </div>
        <Link
          className={buttonVariants({ className: "min-h-11 self-start px-5" })}
          href={`${root}/jobs/new`}
        >
          Create Job
        </Link>
      </div>
      {preview && (
        <p className="rounded-xl border bg-secondary/60 p-4 text-sm leading-relaxed">
          Local UI preview · Synthetic records only. Changes reset on refresh.
        </p>
      )}
      {!data?.ready && (
        <p role="status" className="text-sm text-muted-foreground">
          {data
            ? "Preparing complete dashboard metrics. Records remain available from the sidebar."
            : "Loading dashboard…"}
        </p>
      )}
      <SectionCards data={data} preview={preview} />
      <ChartAreaInteractive
        activity={data?.activity ?? []}
        days={days}
        onRange={onRange}
        preview={preview}
        loading={!data?.ready}
      />
      <div className="grid gap-4 @4xl/main:grid-cols-3">
        <Breakdown
          title="Applicant statuses"
          counts={data?.applications ?? []}
          loading={!data?.ready}
        />
        <Breakdown
          title="Lead statuses"
          counts={data?.leads ?? []}
          loading={!data?.ready}
        />
        <Breakdown
          title="Job statuses"
          counts={data?.jobs ?? []}
          loading={!data?.ready}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent team activity</CardTitle>
          <CardDescription>
            {preview
              ? "Preview changes are temporary; no audit records are saved."
              : "Administrative actions · no applicant details or internal notes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.ready ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading activity…
            </p>
          ) : data.recent.length ? (
            <ul className="divide-y">
              {data.recent.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap justify-between gap-3 py-4 text-sm"
                >
                  <span className="capitalize">
                    {row.action.replaceAll("_", " ")}
                  </span>
                  <span className="text-muted-foreground">
                    {formatAdminDate(row.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No saved administrative activity to display.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
function LiveOverview() {
  const { days, day, setDays } = useOverviewPeriod();
  const data = useQuery(api.overview.summary, { days, day });
  return <OverviewContent data={data} days={days} onRange={setDays} />;
}
export function AdminOverview() {
  return (
    <StaffGate>
      <DashboardShell sectionTitle="Dashboard">
        <LiveOverview />
      </DashboardShell>
    </StaffGate>
  );
}
export function PreviewOverview() {
  const { records } = usePreviewApplicants();
  const { leads } = usePreviewLeads();
  const { jobs } = usePreviewJobs();
  const { days, day, setDays } = useOverviewPeriod();
  return (
    <DashboardShell preview sectionTitle="Dashboard">
      <OverviewContent
        data={previewOverview(records, leads, jobs, days, day)}
        days={days}
        onRange={setDays}
        preview
      />
    </DashboardShell>
  );
}
