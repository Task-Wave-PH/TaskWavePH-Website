"use client";
import { useState } from "react";
import Link from "next/link";
import { Star, ArrowLeft } from "lucide-react";
import type { LeadView } from "@/features/leads/admin-types";
import { formatAdminDate } from "@/features/admin/metrics";
import { leadStatuses } from "@/features/submissions/validation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmation } from "./delete-confirmation";
export function LeadDetails({
  record,
  backHref,
  onSave,
  onPriority,
  onDelete,
}: {
  record: LeadView;
  backHref: string;
  onSave: (
    status: LeadView["status"],
    notes: string,
    expected: Pick<LeadView, "status" | "notes">,
  ) => Promise<void>;
  onPriority: (priority: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [status, setStatus] = useState(record.status),
    [notes, setNotes] = useState(record.notes),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const d = record.data;
  const [baseline, setBaseline] = useState({
    status: record.status,
    notes: record.notes,
  });
  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage("Changes saved.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.includes("EDIT_CONFLICT")
          ? "This enquiry changed while you were editing. Copy your changes, refresh, and review the latest record before saving."
          : "Unable to save. Check your access and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fields = (rows: [string, string][]) => (
    <dl className="grid gap-5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
            {value || "Not provided"}
          </dd>
        </div>
      ))}
    </dl>
  );
  return (
    <>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-4" />
        Back to Business Leads
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="break-words text-2xl font-semibold text-brand-navy sm:text-3xl">
            {d.company}
          </h1>
          <p className="break-all text-sm text-muted-foreground">
            {record.reference} · {formatAdminDate(record.submittedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{record.status}</Badge>
          <Button
            variant={record.priority ? "secondary" : "outline"}
            className="min-h-11 px-4"
            aria-pressed={record.priority ?? false}
            disabled={busy}
            onClick={() => perform(() => onPriority(!record.priority))}
          >
            <Star
              className={record.priority ? "fill-primary text-primary" : ""}
            />
            {record.priority ? "Priority lead" : "Mark priority"}
          </Button>
        </div>
      </div>
      <div className="grid items-start gap-6 @4xl/main:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business & contact</CardTitle>
            </CardHeader>
            <CardContent>
              {fields([
                ["Company", d.company],
                ["Contact name", d.contactName],
                ["Email", d.email],
                ["Phone", d.phone],
                ["Website (provided by contact)", d.companyWebsite],
              ])}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enquiry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium">Services of interest</p>
                <div className="flex flex-wrap gap-2">
                  {d.services.map((service) => (
                    <Badge
                      className="whitespace-normal"
                      key={service}
                      variant="secondary"
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Message</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {d.message || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Submission information</CardTitle>
            </CardHeader>
            <CardContent>
              {fields([
                ["Source", d.source],
                ["Campaign", d.campaign],
                ["UTM source", d.utm_source],
                ["UTM medium", d.utm_medium],
                ["UTM campaign", d.utm_campaign],
                ["Landing page", d.landing_page],
                [
                  "Privacy consent",
                  d.privacyConsent ? "Provided" : "Not provided",
                ],
              ])}
            </CardContent>
          </Card>
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Manage lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lead-status">Status</Label>
              <Select
                disabled={busy}
                value={status}
                onValueChange={(value) => {
                  if (value) setStatus(value as LeadView["status"]);
                }}
              >
                <SelectTrigger id="lead-status" className="h-11! w-full">
                  <SelectValue>{status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map((s) => (
                    <SelectItem value={s} key={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Internal notes</Label>
              <Textarea
                disabled={busy}
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Staff only · {notes.length}/2,000 characters
              </p>
            </div>
            <Button
              className="min-h-11 w-full"
              disabled={busy}
              onClick={() =>
                perform(async () => {
                  await onSave(status, notes, baseline);
                  setBaseline({ status, notes: notes.trim() });
                  setNotes(notes.trim());
                })
              }
            >
              {busy ? "Saving…" : "Save changes"}
            </Button>
            {message && (
              <p role="status" className="text-sm">
                {message}
              </p>
            )}
            <div className="space-y-3 border-t pt-5">
              <p className="text-sm text-muted-foreground">
                Deletion permanently removes this business enquiry.
              </p>
              <DeleteConfirmation
                label="Delete lead"
                description="Permanently remove this enquiry and its internal notes."
                disabled={busy}
                onDelete={onDelete}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
