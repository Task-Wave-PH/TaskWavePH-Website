"use client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { leadSchema, services } from "@/features/leads/schema";
import { getTrackedHref } from "@/features/applications/tracking";
import type { ApplicationTracking } from "@/features/applications/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/application/form-field";
import { TurnstileChallenge } from "./turnstile";
import { useSubmission } from "./use-submission";
import Link from "next/link";
export function BusinessForm({
  tracking,
  enabled,
}: {
  tracking: ApplicationTracking;
  enabled: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const submission = useSubmission(
    "/api/business-leads",
    "/business-enquiry/success",
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof leadSchema>, unknown, z.output<typeof leadSchema>>(
    {
      resolver: zodResolver(leadSchema),
      defaultValues: {
        company: "",
        contactName: "",
        email: "",
        phone: "",
        companyWebsite: "",
        message: "",
        services: [],
        privacyConsent: false,
        website: "",
        ...tracking,
      },
    },
  );
  return (
    <form
      noValidate
      className="space-y-7"
      onChange={() => setPreview(false)}
      onSubmit={handleSubmit(async (data) => {
        if (!enabled) {
          setPreview(true);
          return;
        }
        await submission.submit(data);
      })}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {(
          [
            ["company", "Company"],
            ["contactName", "Contact Name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["companyWebsite", "Company Website"],
          ] as const
        ).map(([name, label]) => (
          <FormField
            key={name}
            id={name}
            label={label}
            optional={name === "phone" || name === "companyWebsite"}
            error={errors[name]?.message}
          >
            <Input
              id={name}
              type={
                name === "email"
                  ? "email"
                  : name === "companyWebsite"
                    ? "url"
                    : "text"
              }
              maxLength={
                name === "companyWebsite" ? 2000 : name === "phone" ? 30 : 254
              }
              {...register(name)}
              aria-invalid={!!errors[name]}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
          </FormField>
        ))}
      </div>
      <fieldset>
        <legend className="mb-4 font-medium">Services Interested In</legend>
        <Controller
          control={control}
          name="services"
          render={({ field }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service, index) => (
                <label
                  key={service}
                  className="flex min-h-11 items-center gap-3"
                >
                  <Checkbox
                    inputRef={index === 0 ? field.ref : undefined}
                    checked={field.value.includes(service)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, service]
                          : field.value.filter((v) => v !== service),
                      )
                    }
                  />
                  {service}
                </label>
              ))}
            </div>
          )}
        />
        {errors.services && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Select at least one service.
          </p>
        )}
      </fieldset>
      <FormField
        id="message"
        label="Tell us what you need"
        error={errors.message?.message}
      >
        <Textarea
          id="message"
          maxLength={2000}
          {...register("message")}
          aria-invalid={!!errors.message}
        />
      </FormField>
      <Controller
        control={control}
        name="privacyConsent"
        render={({ field }) => (
          <label className="flex items-start gap-3 leading-relaxed">
            <Checkbox
              inputRef={field.ref}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={!!errors.privacyConsent}
            />
            <span>
              I agree that TaskWavePH may process my information to respond to
              this business enquiry.
            </span>
          </label>
        )}
      />
      {errors.privacyConsent && (
        <p role="alert" className="text-sm text-destructive">
          {errors.privacyConsent.message}
        </p>
      )}
      <Link
        href={getTrackedHref("/privacy", tracking)}
        className="inline-block text-primary underline"
      >
        Read the privacy notice
      </Link>
      <div
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <input
          {...register("website")}
          tabIndex={-1}
          autoComplete="off"
          aria-label="Leave empty"
        />
      </div>
      {enabled && (
        <TurnstileChallenge
          onToken={submission.setChallenge}
          reset={submission.reset}
        />
      )}
      {submission.error && (
        <p role="alert" className="text-destructive">
          {submission.error}
        </p>
      )}
      {preview && (
        <p role="status">
          Your entries passed the checks. Your enquiry has not been sent or
          saved.
        </p>
      )}
      <Button className="min-h-12" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Please wait…"
          : enabled
            ? "Send Business Enquiry"
            : "Validate Enquiry"}
      </Button>
    </form>
  );
}
