"use client";
import Link from "next/link";
import { useState } from "react";
import { usePreviewApplicants } from "./preview-provider";
import { ExportButtons } from "./export-buttons";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { applicationStatuses } from "@/features/submissions/validation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export function PreviewApplicantsList() {
  const { records } = usePreviewApplicants();
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(20);
  const filtered = records.filter(
    (r) => status === "all" || r.status === status,
  );
  return (
    <>
      <h1 className="sr-only">Applications</h1>
      <SectionCards rows={filtered} />
      <ChartAreaInteractive rows={filtered} preview />
      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(String(v));
          setLimit(20);
        }}
        className="gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-auto! flex-wrap">
            <TabsTrigger className="min-h-11" value="all">
              All records
            </TabsTrigger>
            {applicationStatuses.map((v) => (
              <TabsTrigger className="min-h-11" key={v} value={v}>
                {v}
              </TabsTrigger>
            ))}
          </TabsList>
          <ExportButtons previewRows={filtered} />
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
                {filtered.slice(0, limit).map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>
                      <Link
                        className="font-medium text-primary underline"
                        href={`/dev-preview/applications/${r._id}`}
                      >
                        {r.data.firstName} {r.data.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{r.data.email}</TableCell>
                    <TableCell>
                      {new Date(r.submittedAt).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!filtered.length && <p className="p-5">No records found.</p>}
          <p className="mt-4 text-sm text-muted-foreground">
            Showing {Math.min(filtered.length, limit)} of {filtered.length}{" "}
            sample records. Exports include all matching records.
          </p>
          {filtered.length > limit && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setLimit((v) => v + 20)}
            >
              Load more
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
