"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getTrackedHref } from "@/features/applications/tracking";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationSchema,
  trackingKeys,
} from "@/features/applications/schema";
import type {
  ApplicationInput,
  ApplicationData,
  ApplicationTracking,
} from "@/features/applications/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "./form-field";
import { useSubmission } from "@/components/submissions/use-submission";
import { TurnstileChallenge } from "@/components/submissions/turnstile";
import { validateResume } from "@/features/submissions/validation";
import { SubmissionMessage } from "./submission-message";

const textFields = [
  {
    name: "firstName",
    label: "First Name",
    autoComplete: "given-name",
    maxLength: 100,
  },
  {
    name: "lastName",
    label: "Last Name",
    autoComplete: "family-name",
    maxLength: 100,
  },
  {
    name: "email",
    label: "Email",
    autoComplete: "email",
    type: "email",
    maxLength: 254,
  },
  {
    name: "phone",
    label: "Mobile Number",
    autoComplete: "tel",
    type: "tel",
    maxLength: 30,
    hint: "Philippine mobile number, e.g. 0917 123 4567",
  },
  {
    name: "location",
    label: "City / Location",
    autoComplete: "address-level2",
    maxLength: 200,
  },
  { name: "position", label: "Position Interested In", maxLength: 200 },
  {
    name: "experience",
    label: "Years of Active Work Experience",
    type: "number",
    optional: true,
    maxLength: 10,
  },
  {
    name: "employmentStatus",
    label: "Current Employment Status",
    optional: true,
    maxLength: 200,
  },
  {
    name: "availability",
    label: "Possible Start Date / Availability",
    optional: true,
    maxLength: 200,
  },
  {
    name: "expectedSalary",
    label: "Expected Salary",
    optional: true,
    maxLength: 100,
    hint: "Include currency and pay period, e.g. PHP 25,000/month. Negotiable is also fine.",
  },
  {
    name: "previousSalary",
    label: "Previous Salary",
    optional: true,
    maxLength: 100,
    hint: "Share only if you wish. Include currency and pay period.",
  },
  {
    name: "strengthOne",
    label: "First Key Strength",
    optional: true,
    maxLength: 300,
  },
  {
    name: "strengthTwo",
    label: "Second Key Strength",
    optional: true,
    maxLength: 300,
  },
  {
    name: "distanceFromDagupan",
    label: "Distance / Travel Time from Dagupan",
    optional: true,
    maxLength: 200,
    hint: "If relevant to your role, give an approximate distance or commute time. No exact home address needed.",
  },
  {
    name: "portfolio",
    label: "Portfolio / Project Link",
    optional: true,
    type: "url",
    maxLength: 2000,
    hint: "An optional link to work you can share publicly.",
  },
  {
    name: "resume",
    label: "Resume Link",
    type: "url",
    optional: true,
    maxLength: 2000,
    hint: "Optional alternative to uploading a PDF.",
  },
] as const;

export function ApplicationForm({
  tracking,
  enabled = false,
  job,
}: {
  tracking: ApplicationTracking;
  enabled?: boolean;
  job?: { id: string; title: string };
}) {
  const [selectedJob, setSelectedJob] = useState(job);
  const [validated, setValidated] = useState(false);
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState("");
  const [validatingFile, setValidatingFile] = useState(false);
  const fileRevision = useRef(0);
  const submission = useSubmission("/api/applications", "/apply/success");
  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput, unknown, ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      position: job?.title ?? "",
      ...(job ? { jobId: job.id } : {}),
      experience: "",
      employmentStatus: "",
      availability: "",
      expectedSalary: "",
      previousSalary: "",
      strengthOne: "",
      strengthTwo: "",
      distanceFromDagupan: "",
      relocationPreference: "",
      portfolio: "",
      resume: "",
      message: "",
      privacyConsent: false,
      website: "",
      ...tracking,
    },
    shouldFocusError: true,
  });

  return (
    <form
      noValidate
      onChange={() => setValidated(false)}
      onSubmit={handleSubmit(
        async (data) => {
          if (validatingFile) return;
          if (fileError) {
            setValidated(false);
            return;
          }
          if (!enabled) {
            setValidated(true);
            return;
          }
          await submission.submit(
            { ...data, experience: data.experience?.toString() ?? "" },
            file,
          );
        },
        () => setValidated(false),
      )}
      className="space-y-7"
    >
      {selectedJob && (
        <div className="rounded-lg border bg-secondary p-4">
          <p className="font-medium">Applying for: {selectedJob.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your application will be linked to this role.
          </p>
        </div>
      )}
      <input type="hidden" {...register("jobId")} />
      {[
        {
          title: "Contact and role",
          fields: textFields.filter((field) =>
            [
              "firstName",
              "lastName",
              "email",
              "phone",
              "location",
              "position",
            ].includes(field.name),
          ),
        },
        {
          title: "Experience and screening",
          fields: textFields.filter(
            (field) =>
              ![
                "firstName",
                "lastName",
                "email",
                "phone",
                "location",
                "position",
              ].includes(field.name),
          ),
        },
      ].map((group) => (
        <fieldset
          key={group.title}
          className="min-w-0 rounded-xl border bg-secondary/30 p-4 sm:p-6"
        >
          <legend className="px-2 font-semibold text-brand-navy">
            {group.title}
          </legend>
          {group.title === "Experience and screening" && (
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              These optional details help our recruitment team review your
              profile. Follow the work arrangement in the job posting.
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {group.fields.map((field) => {
              const error = errors[field.name]?.message;
              const hint = "hint" in field ? field.hint : undefined;
              return (
                <FormField
                  key={field.name}
                  id={field.name}
                  label={field.label}
                  optional={"optional" in field}
                  error={error}
                  hint={hint}
                >
                  <Input
                    readOnly={field.name === "position" && !!selectedJob}
                    id={field.name}
                    {...register(field.name)}
                    type={"type" in field ? field.type : "text"}
                    autoComplete={
                      "autoComplete" in field ? field.autoComplete : "off"
                    }
                    maxLength={field.maxLength}
                    required={!("optional" in field)}
                    min={field.name === "experience" ? 0 : undefined}
                    max={field.name === "experience" ? 60 : undefined}
                    step={field.name === "experience" ? "any" : undefined}
                    aria-invalid={!!error}
                    aria-describedby={
                      [
                        hint ? `${field.name}-hint` : "",
                        error ? `${field.name}-error` : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    className="min-h-12 text-base"
                  />
                </FormField>
              );
            })}
          </div>
        </fieldset>
      ))}
      <FormField
        id="relocationPreference"
        label="Willingness to Relocate"
        optional
        hint="For roles requiring relocation. This does not change the role’s advertised work arrangement."
        error={errors.relocationPreference?.message}
      >
        <Controller
          name="relocationPreference"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || "unspecified"}
              onValueChange={(value) => {
                field.onChange(value === "unspecified" ? "" : value);
                setValidated(false);
              }}
            >
              <SelectTrigger
                id="relocationPreference"
                ref={field.ref}
                onBlur={field.onBlur}
                className="min-h-12 w-full"
                aria-invalid={!!errors.relocationPreference}
                aria-describedby={`relocationPreference-hint${errors.relocationPreference ? " relocationPreference-error" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">
                  Not specified / not applicable
                </SelectItem>
                <SelectItem value="Willing">Willing to relocate</SelectItem>
                <SelectItem value="Not willing">
                  Not willing to relocate
                </SelectItem>
                <SelectItem value="Discuss first">
                  Would like to discuss first
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField
        id="message"
        label="Message / Notes"
        optional
        error={errors.message?.message}
        hint="Up to 2,000 characters."
      >
        <Textarea
          id="message"
          {...register("message")}
          maxLength={2000}
          rows={4}
          className="min-h-32 text-base"
          aria-invalid={!!errors.message}
          aria-describedby={`message-hint${errors.message ? " message-error" : ""}`}
        />
      </FormField>
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Controller
            name="privacyConsent"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="privacyConsent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  setValidated(false);
                }}
                onBlur={field.onBlur}
                aria-required="true"
                aria-invalid={!!errors.privacyConsent}
                aria-describedby={
                  errors.privacyConsent ? "privacyConsent-error" : undefined
                }
                className="mt-1 size-6 shrink-0"
              />
            )}
          />
          <div className="text-sm leading-relaxed">
            <label htmlFor="privacyConsent" className="cursor-pointer">
              I agree that TaskWavePH may collect and process the information I
              provide for recruitment and employment-related purposes.
            </label>{" "}
            <Link
              href={getTrackedHref("/privacy", tracking)}
              className="font-medium text-primary underline underline-offset-4"
            >
              Read the privacy notice.
            </Link>
          </div>
        </div>
        {errors.privacyConsent && (
          <p
            id="privacyConsent-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.privacyConsent.message}
          </p>
        )}
      </div>
      <FormField
        id="resumeFile"
        label="Resume PDF"
        optional
        hint="One PDF, up to 2 MB. A resume link can also be provided."
        error={fileError}
      >
        <Input
          id="resumeFile"
          type="file"
          accept="application/pdf,.pdf"
          aria-invalid={!!fileError}
          aria-describedby={
            fileError ? "resumeFile-hint resumeFile-error" : "resumeFile-hint"
          }
          onChange={async (event) => {
            const selected = event.target.files?.[0];
            const revision = ++fileRevision.current;
            setFile(selected);
            setFileError("");
            setValidated(false);
            setValidatingFile(!!selected);
            if (selected)
              try {
                await validateResume(selected);
              } catch {
                if (revision === fileRevision.current)
                  setFileError("Choose a valid PDF no larger than 2 MB.");
              } finally {
                if (revision === fileRevision.current) setValidatingFile(false);
              }
          }}
        />
      </FormField>
      {enabled && (
        <TurnstileChallenge
          key={submission.reset}
          onToken={submission.setChallenge}
          reset={submission.reset}
        />
      )}
      {submission.error && (
        <p role="alert" className="text-sm text-destructive">
          {submission.error}
        </p>
      )}
      {submission.jobUnavailable && selectedJob && (
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-12 whitespace-normal px-6 py-3"
          onClick={() => {
            setSelectedJob(undefined);
            setValue("jobId", undefined);
            setValidated(false);
          }}
        >
          Continue as a General Application
        </Button>
      )}
      {trackingKeys.map((key) => (
        <input key={key} type="hidden" {...register(key)} />
      ))}
      <input type="hidden" {...register("landing_page")} />
      <div
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          {...register("website")}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {errors.website && (
        <p role="alert" className="text-sm text-destructive">
          Unable to validate this application.
        </p>
      )}
      {validated && <SubmissionMessage />}
      <Button
        type="submit"
        disabled={
          isSubmitting || validatingFile || (enabled && submission.disabled)
        }
        aria-busy={isSubmitting || submission.sending || validatingFile}
        className="min-h-12 w-full px-6 text-base sm:w-auto"
      >
        {validatingFile
          ? "Checking PDF…"
          : submission.cooldown > 0
            ? `Try again in ${submission.cooldown}s`
            : isSubmitting || submission.sending
              ? enabled
                ? "Submitting…"
                : "Validating…"
              : enabled
                ? "Submit Application"
                : "Validate Application"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {enabled
          ? "Your information is used for recruitment-related purposes."
          : "Applications are not open yet. This form checks your entries locally; it does not send or save your information."}
      </p>
    </form>
  );
}
