"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { ApplicantView } from "@/features/applications/admin-types";
import { formatAdminDate } from "@/features/admin/metrics";
import { applicationStatuses } from "@/features/submissions/validation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
const PdfViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => <p role="status">Preparing PDF viewer…</p>,
});
export function ApplicantDetails({
  record,
  backHref,
  resumeUrl,
  onSave,
  onDelete,
}: {
  record: ApplicantView;
  backHref: string;
  resumeUrl?: string;
  onSave: (
    status: ApplicantView["status"],
    notes: string,
    expected: Pick<ApplicantView, "status" | "notes">,
  ) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [status, setStatus] = useState(record.status);
  const [notes, setNotes] = useState(record.notes);
  const [baseline, setBaseline] = useState({
    status: record.status,
    notes: record.notes,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const d = record.data;
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await onSave(status, notes, baseline);
      setBaseline({ status, notes: notes.trim() });
      setNotes(notes.trim());
      setMessage("Changes saved.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.includes("EDIT_CONFLICT")
          ? "This review changed while you were editing. Copy your changes, refresh, and review the latest record before saving."
          : "Unable to save. Check your access and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      await onDelete();
    } catch {
      setMessage("Unable to delete. Check your access and try again.");
    } finally {
      setBusy(false);
    }
  }
  const fields = (rows: [string, string | number | undefined][]) => (
    <dl className="grid gap-5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className={
            label === "Message / notes" ? "min-w-0 sm:col-span-2" : "min-w-0"
          }
        >
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {value === undefined || value === "" ? "Not provided" : value}
          </dd>
        </div>
      ))}
    </dl>
  );
  return (
    <>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-4"
      >
        Back to applications
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="break-words text-2xl font-semibold text-brand-navy sm:text-3xl">
            {d.firstName} {d.lastName}
          </h1>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            {record.reference} · {formatAdminDate(record.submittedAt)}
          </p>
        </div>
        <Badge variant="outline">{record.status}</Badge>
      </div>
      <div className="grid items-start gap-6 @4xl/main:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <Tabs defaultValue="profile" className="min-w-0 gap-5">
          <TabsList className="h-auto! max-w-full flex-wrap gap-1">
            <TabsTrigger value="profile" className="min-h-11">
              Profile
            </TabsTrigger>
            <TabsTrigger value="cv" className="min-h-11">
              CV
            </TabsTrigger>
            <TabsTrigger value="submission" className="min-h-11">
              Submission
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact information</CardTitle>
              </CardHeader>
              <CardContent>
                {fields([
                  ["First name", d.firstName],
                  ["Last name", d.lastName],
                  ["Email", d.email],
                  ["Mobile number", d.phone],
                  ["City / location", d.location],
                ])}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Experience and availability</CardTitle>
              </CardHeader>
              <CardContent>
                {fields([
                  ["Position interested in", d.position],
                  ["Associated Job", d.jobTitle],
                  ["Job ID", d.jobId],
                  ["Years of experience", d.experience],
                  ["Employment status", d.employmentStatus],
                  ["Availability", d.availability],
                  ["Message / notes", d.message],
                ])}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cv">
            <Card>
              <CardHeader>
                <CardTitle>Curriculum vitae</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.resumeFile && resumeUrl ? (
                  <>
                    <p className="break-words text-sm">
                      {record.resumeFile.name} ·{" "}
                      {(record.resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                    <a
                      className={buttonVariants({
                        variant: "outline",
                        className: "min-h-11 px-5",
                      })}
                      href={`${resumeUrl}${resumeUrl.includes("?") ? "&" : "?"}mode=download`}
                    >
                      Download CV
                    </a>
                    <PdfViewer
                      key={record._id}
                      url={`${resumeUrl}${resumeUrl.includes("?") ? "&" : "?"}mode=view`}
                    />
                  </>
                ) : (
                  <p>No PDF CV was provided.</p>
                )}
                {d.resume && (
                  <p className="break-words text-sm">
                    Resume link:{" "}
                    <a
                      href={d.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {d.resume}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submission">
            <Card>
              <CardHeader>
                <CardTitle>Submission and consent</CardTitle>
              </CardHeader>
              <CardContent>
                {fields([
                  ["Application ID", record.reference],
                  ["Submitted at", new Date(record.submittedAt).toISOString()],
                  [
                    "Privacy consent",
                    d.privacyConsent ? "Agreed" : "Not agreed",
                  ],
                  ["Consent version", record.consentVersion],
                  ["Source", d.source],
                  ["Campaign", d.campaign],
                  ["UTM source", d.utm_source],
                  ["UTM medium", d.utm_medium],
                  ["UTM campaign", d.utm_campaign],
                  ["Landing page", d.landing_page],
                ])}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Card>
          <CardHeader>
            <CardTitle>Recruitment review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="applicant-status">Status</Label>
              <Select
                disabled={busy}
                value={status}
                onValueChange={(v) => {
                  const value = applicationStatuses.find((s) => s === v);
                  if (value) setStatus(value);
                }}
              >
                <SelectTrigger
                  id="applicant-status"
                  className="h-11! w-full sm:w-64"
                >
                  <SelectValue>{status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {applicationStatuses.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="applicant-notes">Internal notes</Label>
              <Textarea
                disabled={busy}
                id="applicant-notes"
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Staff only · {notes.length}/2,000 characters
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="min-h-11 px-5" disabled={busy} onClick={save}>
                {busy ? "Please wait…" : "Save changes"}
              </Button>
              <Button
                variant="destructive"
                className="min-h-11 px-5"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Delete applicant
              </Button>
            </div>
            <p role="status">{message}</p>
          </CardContent>
        </Card>
      </div>
      <Sheet
        open={confirm}
        onOpenChange={(open) => {
          if (!busy) setConfirm(open);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete applicant?</SheetTitle>
            <SheetDescription>
              This permanently deletes the application and attached CV. This
              cannot be undone.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-wrap gap-3 p-5">
            <Button variant="destructive" disabled={busy} onClick={remove}>
              Confirm deletion
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
