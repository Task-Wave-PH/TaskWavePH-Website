"use client";
import Link from "next/link";
import {
  FileText,
  Handshake,
  BriefcaseBusiness,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countStatus,
  total,
  type OverviewData,
} from "@/features/admin/metrics";
export type DashboardRow = { status: string; submittedAt: number };
export function SectionCards({
  data,
  preview = false,
}: {
  data?: OverviewData;
  preview?: boolean;
}) {
  const root = preview ? "/dev-preview" : "/admin";
  const cards = [
    {
      label: "Applicants",
      value: total(data?.applications ?? []),
      note: `${countStatus(data?.applications ?? [], "New")} awaiting review`,
      icon: FileText,
      href: "applications",
    },
    {
      label: "Business leads",
      value: total(data?.leads ?? []),
      note: `${data?.priorityLeads ?? 0} marked as priority`,
      icon: Handshake,
      href: "businessLeads",
    },
    {
      label: "Published jobs",
      value: countStatus(data?.jobs ?? [], "Published"),
      note: "Visible on the Careers page",
      icon: BriefcaseBusiness,
      href: "jobs?status=Published",
    },
    {
      label: "Draft jobs",
      value: countStatus(data?.jobs ?? [], "Draft"),
      note: "Prepare and publish approved roles",
      icon: Clock3,
      href: "jobs?status=Draft",
    },
  ];
  return (
    <div className="grid gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-4">
      {cards.map(({ label, value, note, icon: Icon, href }) => (
        <Card
          key={label}
          className="gap-4 bg-linear-to-t from-primary/5 to-card shadow-xs"
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle
                className="text-3xl font-semibold tabular-nums text-brand-navy"
                data-testid={`metric-${href.split("?")[0]}-${label.replaceAll(" ", "-").toLowerCase()}`}
              >
                {data?.ready ? value.toLocaleString() : "—"}
              </CardTitle>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 text-sm">
            <p className="min-h-10 text-muted-foreground">
              {data?.ready ? note : "Preparing totals…"}
            </p>
            <Link
              href={`${root}/${href}`}
              className="mt-auto inline-flex min-h-11 items-center gap-2 self-start font-medium text-primary"
            >
              View {label.toLowerCase()}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
