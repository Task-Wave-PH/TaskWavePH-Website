"use client";
import { adminOperation } from "@/features/admin/operation-feedback";
import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  jobSchema,
  serviceAreas,
  workArrangements,
  employmentTypes,
  type JobInput,
  type JobView,
  type JobStatus,
} from "@/features/jobs/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";
const defaults: JobInput = {
  title: "",
  serviceArea: serviceAreas[0],
  location: "",
  arrangement: "Remote",
  employmentType: "Full-time",
  description: "",
  responsibilities: "",
  requirements: "",
  salary: "",
};
export function JobEditor({
  job,
  preview = false,
  onSave,
  onStatus,
  onDelete,
  deletionAllowed,
}: {
  job?: JobView;
  preview?: boolean;
  onSave: (data: JobInput, expectedUpdatedAt?: number) => Promise<void>;
  onStatus?: (status: JobStatus) => Promise<void>;
  onDelete?: () => Promise<void>;
  deletionAllowed?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: job ?? defaults,
    values: job ?? defaults,
    resetOptions: { keepDirtyValues: true, keepDirty: true },
  });
  const values = useWatch({ control });
  const [editVersion, setEditVersion] = useState(job?.updatedAt);
  if (
    !isDirty &&
    !Object.keys(dirtyFields).length &&
    editVersion !== job?.updatedAt
  )
    setEditVersion(job?.updatedAt);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<JobStatus>();
  const [busy, setBusy] = useState(false);
  async function changeStatus() {
    if (!confirmation || !onStatus) return;
    setBusy(true);
    setMessage("");
    try {
      await adminOperation(() => onStatus(confirmation), {
        loading: "Updating posting status…",
        success: `Posting changed to ${confirmation.toLowerCase()}.`,
        error: "Unable to update. Check your access and try again.",
        preview,
      });
      setConfirmation(undefined);
      setMessage("Posting status updated.");
    } catch {
      setMessage("Unable to update. Check your access and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link
        href={preview ? "/dev-preview/jobs" : "/admin/jobs"}
        className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-4"
      >
        Back to jobs
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
          {job ? "Edit Job Posting" : "Create Job Posting"}
        </h1>
        <Badge variant="outline">{job?.status ?? "Draft"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Use approved role information. New postings remain drafts until
        explicitly published. Salary is optional; all other fields are required.
      </p>
      <Card className="py-0">
        <CardContent className="p-5 sm:p-8">
          <form
            noValidate
            className="space-y-6"
            onSubmit={handleSubmit(async (data) => {
              setMessage("");
              try {
                await adminOperation(() => onSave(data, editVersion), {
                  loading: "Saving posting…",
                  success: "Posting saved.",
                  error:
                    "Unable to save the posting. Check the page for details.",
                  preview,
                });
                reset(data, { keepDirtyValues: false, keepDirty: false });
                setMessage("Posting saved.");
              } catch (error) {
                setMessage(
                  error instanceof Error &&
                    error.message.includes("EDIT_CONFLICT")
                    ? "This posting changed while you were editing. Copy your changes, refresh, and review the latest posting before saving."
                    : "Unable to save. Check your access and try again.",
                );
              }
            })}
          >
            <fieldset className="min-w-0 rounded-xl border border-border/70 bg-muted/30 p-4 sm:p-6">
              <legend className="px-2 text-sm font-semibold text-brand-navy">
                Role information
              </legend>
              <div className="grid gap-6 sm:grid-cols-2">
                {(
                  [
                    ["title", "Job Title", 200],
                    ["location", "Location", 200],
                    ["salary", "Salary (optional)", 200],
                  ] as const
                ).map(([name, label, max]) => (
                  <div key={name} className="grid min-w-0 content-start gap-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Input
                      disabled={isSubmitting || busy}
                      id={name}
                      {...register(name)}
                      maxLength={max}
                      aria-invalid={!!errors[name]}
                      aria-describedby={
                        errors[name] ? `${name}-error` : undefined
                      }
                      className="min-h-11"
                    />
                    {errors[name] && (
                      <p
                        id={`${name}-error`}
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {errors[name]?.message}
                      </p>
                    )}
                  </div>
                ))}
                {(
                  [
                    ["serviceArea", "Service Area", serviceAreas],
                    ["arrangement", "Work Arrangement", workArrangements],
                    ["employmentType", "Employment Type", employmentTypes],
                  ] as const
                ).map(([name, label, options]) => (
                  <div key={name} className="grid min-w-0 content-start gap-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Select
                      disabled={isSubmitting || busy}
                      value={values[name]}
                      onValueChange={(value) => {
                        if (value)
                          setValue(name, value as JobInput[typeof name], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                      }}
                    >
                      <SelectTrigger
                        aria-label={label}
                        id={name}
                        className="h-11! w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </fieldset>
            {(
              [
                ["description", "Description"],
                ["responsibilities", "Responsibilities"],
                ["requirements", "Requirements"],
              ] as const
            ).map(([name, label]) => (
              <div
                key={name}
                className="min-w-0 space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:p-6"
              >
                <Label htmlFor={name}>{label}</Label>
                <Textarea
                  disabled={isSubmitting || busy}
                  id={name}
                  {...register(name)}
                  rows={5}
                  maxLength={10000}
                  aria-invalid={!!errors[name]}
                  aria-describedby={errors[name] ? `${name}-error` : undefined}
                />
                {errors[name] && (
                  <p
                    id={`${name}-error`}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              className="min-h-11 px-5"
              disabled={isSubmitting || busy}
            >
              {isSubmitting ? "Saving…" : "Save Posting"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {job && onStatus && (
        <Card>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Save changes before updating publication status. Publishing makes
              this role publicly visible; closing stops new role-specific
              applications.
            </p>
            <div className="flex flex-wrap gap-3">
              {job.status !== "Published" && job.status !== "Archived" && (
                <Button
                  className="min-h-11 px-5"
                  disabled={isSubmitting || busy || isDirty}
                  onClick={() => setConfirmation("Published")}
                >
                  Publish Posting
                </Button>
              )}
              {job.status !== "Closed" && job.status !== "Archived" && (
                <Button
                  className="min-h-11 px-5"
                  variant="outline"
                  disabled={isSubmitting || busy || isDirty}
                  onClick={() => setConfirmation("Closed")}
                >
                  Close Posting
                </Button>
              )}
              {job.status !== "Draft" && (
                <Button
                  className="min-h-11 px-5"
                  variant="outline"
                  disabled={isSubmitting || busy || isDirty}
                  onClick={() => setConfirmation("Draft")}
                >
                  {job.status === "Archived"
                    ? "Restore to Draft"
                    : "Move to Draft"}
                </Button>
              )}
              {job.status !== "Archived" && (
                <Button
                  className="min-h-11 px-5"
                  variant="outline"
                  disabled={isSubmitting || busy || isDirty}
                  onClick={() => setConfirmation("Archived")}
                >
                  Archive Posting
                </Button>
              )}
            </div>
            {onDelete && (
              <div className="space-y-3 border-t pt-5">
                <p className="text-sm text-muted-foreground">
                  {deletionAllowed === false
                    ? "This job has linked applications. Archive it to preserve recruitment history; permanent deletion is unavailable."
                    : "Jobs without linked applications can be permanently deleted."}
                </p>
                <DeleteConfirmation
                  label="Delete job"
                  description="Permanently remove this job posting."
                  disabled={
                    isSubmitting || busy || isDirty || deletionAllowed !== true
                  }
                  onDelete={onDelete}
                  preview={preview}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {message && <p role="status">{message}</p>}
      <Sheet
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(undefined);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {confirmation === "Published"
                ? "Publish this role?"
                : confirmation === "Closed"
                  ? "Close this role?"
                  : confirmation === "Archived"
                    ? "Archive this role?"
                    : "Move this role to draft?"}
            </SheetTitle>
            <SheetDescription>
              {confirmation === "Published"
                ? "This posting will appear publicly on Careers."
                : "This posting will no longer appear publicly or accept new role-specific applications. Existing applications remain available."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-wrap gap-3 p-6">
            <Button disabled={busy} onClick={changeStatus}>
              Confirm
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setConfirmation(undefined)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
