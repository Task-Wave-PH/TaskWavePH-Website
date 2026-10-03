"use client";
import Link from "next/link";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StaffGate, DashboardShell } from "./dashboard";
import { AccessLoading } from "./access-loading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export function ActivityPage() {
  return (
    <StaffGate>
      <OwnerActivity />
    </StaffGate>
  );
}
function OwnerActivity() {
  const current = useQuery(api.staffManagement.current, {});
  if (!current) return <AccessLoading message="Checking owner access…" />;
  return (
    <DashboardShell sectionTitle="Activity">
      {current.role === "Owner" ? (
        <ActivityRecords />
      ) : (
        <Card>
          <CardContent className="space-y-4 py-6">
            <h1 className="text-2xl font-semibold text-brand-navy">
              Owner access required
            </h1>
            <p className="text-muted-foreground">
              Only owners can view staff activity history.
            </p>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center text-primary"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
function ActivityRecords() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.activity,
    {},
    { initialNumItems: 20 },
  );
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h1>Staff activity</h1>
        </CardTitle>
        <CardDescription>
          Who performed administrative actions and when. Applicant information
          and internal notes are excluded.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {status === "LoadingFirstPage" ? (
          <p role="status">Loading activity…</p>
        ) : results.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Staff member</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Manila",
                    }).format(row.timestamp)}
                  </TableCell>
                  <TableCell className="max-w-64 break-words whitespace-normal">
                    {row.actorLabel}
                  </TableCell>
                  <TableCell className="capitalize whitespace-normal">
                    {row.action.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell className="max-w-64 break-all whitespace-normal text-muted-foreground">
                    {row.record}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No recorded activity yet.
          </p>
        )}
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(20)}
          >
            {status === "LoadingMore" ? "Loading…" : "Load more"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
