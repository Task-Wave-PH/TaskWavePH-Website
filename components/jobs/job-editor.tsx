"use client";
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
}: {
  job?: JobView;
  preview?: boolean;
  onSave: (data: JobInput) => Promise<void>;
  onStatus?: (status: JobStatus) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: job ?? defaults,
  });
  const values = useWatch({ control });
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<JobStatus>();
  const [busy, setBusy] = useState(false);
  async function changeStatus() {
    if (!confirmation || !onStatus) return;
    setBusy(true);
    setMessage("");
    try {
      await onStatus(confirmation);
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
        className="text-primary underline"
      >
        Back to jobs
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">
          {job ? "Edit Job Posting" : "Create Job Posting"}
        </h1>
        <Badge variant="outline">{job?.status ?? "Draft"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Use approved role information. New postings remain drafts until
        explicitly published. Salary is optional; all other fields are required.
      </p>
      <Card>
        <CardContent className="p-6">
          <form
            noValidate
            className="space-y-6"
            onSubmit={handleSubmit(async (data) => {
              setMessage("");
              try {
                await onSave(data);
                setMessage("Posting saved.");
              } catch {
                setMessage("Unable to save. Check your access and try again.");
              }
            })}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {(
                [
                  ["title", "Job Title", 200],
                  ["location", "Location", 200],
                  ["salary", "Salary (optional)", 200],
                ] as const
              ).map(([name, label, max]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
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
                <div key={name} className="space-y-2">
                  <Label>{label}</Label>
                  <Select
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
                      className="min-h-11 w-full"
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
            {(
              [
                ["description", "Description"],
                ["responsibilities", "Responsibilities"],
                ["requirements", "Requirements"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Textarea
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
            <Button type="submit" disabled={isSubmitting || busy}>
              {isSubmitting ? "Saving…" : "Save Posting"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {job && onStatus && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Save changes before updating publication status. Publishing makes
            this role publicly visible; closing stops new role-specific
            applications.
          </p>
          <div className="flex flex-wrap gap-3">
            {job.status !== "Published" && (
              <Button
                disabled={isSubmitting || busy || isDirty}
                onClick={() => setConfirmation("Published")}
              >
                Publish Posting
              </Button>
            )}
            {job.status !== "Closed" && (
              <Button
                variant="outline"
                disabled={isSubmitting || busy || isDirty}
                onClick={() => setConfirmation("Closed")}
              >
                Close Posting
              </Button>
            )}
            {job.status !== "Draft" && (
              <Button
                variant="outline"
                disabled={isSubmitting || busy || isDirty}
                onClick={() => setConfirmation("Draft")}
              >
                Move to Draft
              </Button>
            )}
          </div>
        </div>
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
                  : "Move this role to draft?"}
            </SheetTitle>
            <SheetDescription>
              {confirmation === "Published"
                ? "This posting will appear publicly on Careers."
                : "This posting will no longer appear publicly or accept new role-specific applications. Existing applications remain available."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3 p-6">
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
