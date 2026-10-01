"use client";
import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DashboardRow } from "@/components/section-cards";
const config = {
  records: { label: "Submissions", color: "var(--primary)" },
} satisfies ChartConfig;
const ranges = [
  { value: "90", label: "Last 3 months" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" },
];
const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
export function ChartAreaInteractive({
  rows,
  preview = false,
  loading = false,
}: {
  rows: DashboardRow[];
  preview?: boolean;
  loading?: boolean;
}) {
  const [range, setRange] = useState("90");
  const gradient = useId().replaceAll(":", "");
  const end = rows.length ? Math.max(...rows.map((r) => r.submittedAt)) : 0;
  const endDay = Math.floor(end / 86400000);
  const data = Array.from({ length: Number(range) }, (_, index) => {
    const day = endDay - Number(range) + index + 1;
    return {
      date: new Date(day * 86400000).toISOString().slice(0, 10),
      records: rows.filter((r) => Math.floor(r.submittedAt / 86400000) === day)
        .length,
    };
  });
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Submission activity</CardTitle>
        <CardDescription>
          {preview
            ? "Sample submissions for design preview"
            : "Currently loaded records · period ends at the latest loaded submission"}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[range]}
            onValueChange={(values) => setRange(values[0] ?? "90")}
            variant="outline"
            className="hidden @[767px]/card:flex"
            aria-label="Chart period"
          >
            {ranges.map((r) => (
              <ToggleGroupItem key={r.value} value={r.value}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={range}
            onValueChange={(v) => setRange(String(v ?? "90"))}
          >
            <SelectTrigger
              className="w-40 @[767px]/card:hidden"
              aria-label="Chart period"
            >
              <SelectValue>
                {ranges.find((r) => r.value === range)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading || !rows.length ? (
          <div
            className="flex h-[250px] items-center justify-center text-sm text-muted-foreground"
            role="status"
          >
            {loading ? "Loading activity…" : "No submissions to display."}
          </div>
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto h-[250px] w-full"
            aria-label="Submission activity by day"
          >
            <AreaChart data={data} accessibilityLayer>
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-records)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-records)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={dateLabel}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => dateLabel(String(v))}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="records"
                type="natural"
                fill={`url(#${gradient})`}
                stroke="var(--color-records)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
