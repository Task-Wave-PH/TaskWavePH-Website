"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
const responseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  retryAfterSeconds: z.number().int().min(1).max(3600).optional(),
});
export function useSubmission(endpoint: string, successPath: string) {
  const token = useRef<string>(undefined);
  const fingerprint = useRef<string>(undefined);
  const locked = useRef(false);
  const activeRequest = useRef<AbortController>(undefined);
  const [challenge, setChallenge] = useState("");
  const [reset, setReset] = useState(0);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [jobUnavailable, setJobUnavailable] = useState(false);
  const [error, setError] = useState("");
  const coolingDown = cooldown > 0;
  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [coolingDown]);
  useEffect(() => () => activeRequest.current?.abort(), []);
  async function submit(data: object, file?: File) {
    if (locked.current || coolingDown) return;
    locked.current = true;
    setError("");
    setJobUnavailable(false);
    let completed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!challenge) {
        setError("Please complete the security check.");
        return;
      }
      setSending(true);
      const identity =
        JSON.stringify(data) +
        (file ? `${file.name}:${file.size}:${file.lastModified}` : "");
      if (identity !== fingerprint.current) {
        token.current = crypto.randomUUID();
        fingerprint.current = identity;
      }
      const body = new FormData();
      body.set("fields", JSON.stringify(data));
      body.set("submissionToken", token.current!);
      body.set("turnstileToken", challenge);
      if (file) body.set("resumeFile", file);
      const controller = new AbortController();
      activeRequest.current = controller;
      timeout = setTimeout(() => controller.abort(), 90000);
      const response = await fetch(endpoint, {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const result = responseSchema.parse(await response.json());
      if (response.ok && result.success) {
        window.location.assign(successPath);
        completed = true;
        return;
      }
      const retryHeader = Number(response.headers.get("Retry-After"));
      setCooldown(
        result.error === "RATE_LIMITED"
          ? (result.retryAfterSeconds ??
              (Number.isFinite(retryHeader) && retryHeader > 0
                ? Math.min(3600, Math.ceil(retryHeader))
                : 60))
          : 3,
      );
      setJobUnavailable(result.error === "JOB_UNAVAILABLE");
      setError(
        result.error === "JOB_UNAVAILABLE"
          ? "This role is no longer accepting applications. Your details are still here; you can continue as a general application."
          : result.error === "RATE_LIMITED"
            ? "Too many attempts. Please wait before trying again."
            : result.error === "SUBMISSION_IN_PROGRESS"
              ? "Your submission is still being processed. Please wait, then try again."
              : result.error === "TOKEN_CONFLICT"
                ? "Your details changed. Please review and submit again."
                : result.error === "CHALLENGE_FAILED"
                  ? "The security check expired or failed. Please complete it again."
                  : "We couldn't submit your information right now. Please try again.",
      );
      if (result.error === "TOKEN_CONFLICT") fingerprint.current = undefined;
    } catch (error) {
      setCooldown(3);
      setError(
        error instanceof Error && error.name === "AbortError"
          ? "The request timed out and may have completed. Your details are still here. Complete the security check and retry without changing them to avoid a duplicate."
          : "We couldn't submit your information right now. Please try again.",
      );
    } finally {
      clearTimeout(timeout);
      activeRequest.current = undefined;
      if (!completed) {
        locked.current = false;
        setSending(false);
        setChallenge("");
        setReset((value) => value + 1);
      }
    }
  }
  return {
    submit,
    challenge,
    setChallenge,
    reset,
    error,
    jobUnavailable,
    sending,
    cooldown,
    disabled: sending || coolingDown || !challenge,
  };
}
