"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Clock, CircleCheck, Archive } from "lucide-react";
export type DashboardRow = { status: string; submittedAt: number };
// The dashboard-01 card structure, with counts from the currently loaded records.
export function SectionCards({
  rows,
  loading = false,
}: {
  rows: DashboardRow[];
  loading?: boolean;
}) {
  const cards = [
    {
      label: "Loaded records",
      value: rows.length,
      caption: "Records in this view",
      note: "Includes the current status filter",
      icon: FileText,
    },
    {
      label: "New submissions",
      value: rows.filter((r) => r.status === "New").length,
      caption: "Ready for review",
      note: "New records in this view",
      icon: Clock,
    },
    {
      label: "In progress",
      value: rows.filter((r) => !["New", "Closed"].includes(r.status)).length,
      caption: "Review is underway",
      note: "Reviewed, shortlisted or contacted",
      icon: CircleCheck,
    },
    {
      label: "Closed records",
      value: rows.filter((r) => r.status === "Closed").length,
      caption: "Review completed",
      note: "Closed records in this view",
      icon: Archive,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map(({ label, value, caption, note, icon: Icon }) => (
        <Card key={label} className="@container/card">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {loading ? "—" : value.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Icon className="size-3" />
                <span className="sr-only">{label}</span>
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 border-0 bg-transparent text-sm">
            <div className="flex gap-2 font-medium">{caption}</div>
            <div className="text-muted-foreground">{note}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
