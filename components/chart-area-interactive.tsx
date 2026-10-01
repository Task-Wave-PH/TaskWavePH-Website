"use client";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OverviewData } from "@/features/admin/metrics";
const config = {
  applications: { label: "Applicants", color: "var(--primary)" },
  leads: { label: "Business leads", color: "var(--brand-navy)" },
} satisfies ChartConfig;
const label = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
export function ChartAreaInteractive({
  activity,
  days,
  onRange,
  loading,
  preview,
}: {
  activity: OverviewData["activity"];
  days: 7 | 30 | 90;
  onRange: (days: 7 | 30 | 90) => void;
  loading?: boolean;
  preview?: boolean;
}) {
  const gradient = useId().replaceAll(":", "");
  const empty = !activity.some((row) => row.applications || row.leads);
  return (
    <Card className="min-w-0 gap-6">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle>Submission activity</CardTitle>
          <CardDescription>
            {preview ? "Sample records" : "Retained applications and enquiries"}{" "}
            · Philippine time
          </CardDescription>
        </div>
        <Select
          value={String(days)}
          onValueChange={(value) => onRange(Number(value ?? 30) as 7 | 30 | 90)}
        >
          <SelectTrigger
            aria-label="Chart period"
            className="h-11! w-full sm:w-44"
          >
            <SelectValue>Last {days} days</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[7, 30, 90].map((d) => (
              <SelectItem key={d} value={String(d)}>
                Last {d} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            Applicants
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-navy" />
            Business leads
          </span>
        </div>
        {loading ? (
          <div
            className="flex h-[260px] items-center justify-center text-sm text-muted-foreground"
            role="status"
          >
            Preparing activity…
          </div>
        ) : (
          <>
            {empty && (
              <p role="status" className="text-sm text-muted-foreground">
                No submissions in this period.
              </p>
            )}
            <ChartContainer
              config={config}
              className="aspect-auto h-[260px] w-full"
              aria-label="Applicant and business enquiry submissions by day"
            >
              <AreaChart
                data={activity}
                accessibilityLayer
                margin={{ left: -22, right: 4 }}
              >
                <defs>
                  {["applications", "leads"].map((key) => (
                    <linearGradient
                      key={key}
                      id={`${gradient}-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`var(--color-${key})`}
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${key})`}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={36}
                  tickFormatter={label}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => label(String(v))}
                    />
                  }
                />
                {["leads", "applications"].map((key) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="linear"
                    fill={`url(#${gradient}-${key})`}
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
            <details className="text-sm">
              <summary className="min-h-11 cursor-pointer py-3 text-primary">
                View activity as a table
              </summary>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">
                    Daily submissions in Philippine time
                  </caption>
                  <thead>
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Applicants</th>
                      <th className="p-2">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.date}>
                        <td className="p-2">{label(row.date)}</td>
                        <td className="p-2">{row.applications}</td>
                        <td className="p-2">{row.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
