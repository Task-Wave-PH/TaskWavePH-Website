"use client";

import Link from "next/link";
import { useState } from "react";
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
    label: "Years of Experience",
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
    label: "Availability",
    optional: true,
    maxLength: 200,
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
}: {
  tracking: ApplicationTracking;
  enabled?: boolean;
}) {
  const [validated, setValidated] = useState(false);
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState("");
  const submission = useSubmission("/api/applications", "/apply/success");
  const {
    register,
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
      position: "",
      experience: "",
      employmentStatus: "",
      availability: "",
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
          if (fileError) {
            setValidated(false);
            return;
          }
          if (!enabled) {
            setValidated(true);
            return;
          }
          if (fileError) return;
          await submission.submit(
            { ...data, experience: data.experience?.toString() ?? "" },
            file,
          );
        },
        () => setValidated(false),
      )}
      className="space-y-7"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {textFields.map((field) => {
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
          className="text-base"
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
            setFile(selected);
            setFileError("");
            if (selected)
              try {
                await validateResume(selected);
              } catch {
                setFileError("Choose a valid PDF no larger than 2 MB.");
              }
          }}
        />
      </FormField>
      {enabled && (
        <TurnstileChallenge
          onToken={submission.setChallenge}
          reset={submission.reset}
        />
      )}
      {submission.error && (
        <p role="alert" className="text-sm text-destructive">
          {submission.error}
        </p>
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
        disabled={isSubmitting}
        className="min-h-12 w-full text-base sm:w-auto"
      >
        {isSubmitting
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
