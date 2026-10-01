"use client";
import { useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applicationStatuses,
  leadStatuses,
} from "@/features/submissions/validation";
export function PreviewDashboardContent({
  kind,
}: {
  kind: "applications" | "businessLeads";
}) {
  const [status, setStatus] = useState("all");
  const statuses = kind === "applications" ? applicationStatuses : leadStatuses;
  const sampleRows = Array.from({ length: 360 }, (_, i) => ({
    status: statuses[i % statuses.length],
    submittedAt:
      Date.UTC(2026, 9, 1) - ((i * 17 + Math.floor(i / 8)) % 90) * 86400000,
  }));
  const filtered = sampleRows.filter(
    (row) => status === "all" || row.status === status,
  );
  return (
    <>
      <h1 className="sr-only">
        {kind === "applications" ? "Applications" : "Business Leads"}
      </h1>
      <SectionCards rows={filtered} />
      <ChartAreaInteractive rows={filtered} preview />
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(String(value))}
        className="gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-auto! min-h-9 flex-wrap">
            <TabsTrigger className="min-h-9" value="all">
              All records
            </TabsTrigger>
            {statuses.map((value) => (
              <TabsTrigger className="min-h-9" key={value} value={value}>
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
          <Badge variant="outline">Sample records</Badge>
        </div>
        <TabsContent value={status}>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 8).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {kind === "applications"
                        ? "Sample applicant"
                        : "Sample business"}{" "}
                      {index + 1}
                    </TableCell>
                    <TableCell>sample-{index + 1}@example.invalid</TableCell>
                    <TableCell>
                      {new Date(row.submittedAt).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Showing {Math.min(filtered.length, 8)} of {filtered.length} sample
            records.
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}
