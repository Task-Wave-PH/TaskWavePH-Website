"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function useSubmission(endpoint: string, successPath: string) {
  const router = useRouter();
  const token = useRef<string>(undefined);
  const fingerprint = useRef<string>(undefined);
  const locked = useRef(false);
  const [challenge, setChallenge] = useState("");
  const [reset, setReset] = useState(0);
  const [error, setError] = useState("");
  async function submit(data: object, file?: File) {
    if (locked.current) return;
    locked.current = true;
    setError("");
    try {
      if (!challenge) {
        setError("Please complete the security check.");
        return;
      }
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
      const response = await fetch(endpoint, { method: "POST", body });
      const result = await response.json();
      if (response.ok && result.success) {
        router.push(successPath);
        return;
      }
      setError(
        result.error === "RATE_LIMITED"
          ? "Too many attempts. Please try again later."
          : result.error === "SUBMISSION_IN_PROGRESS"
            ? "Your submission is still being processed. Please wait, then try again."
            : result.error === "TOKEN_CONFLICT"
              ? "Your details changed. Please review and submit again."
              : "We couldn't submit your information right now. Please try again.",
      );
      if (result.error === "TOKEN_CONFLICT") fingerprint.current = undefined;
    } catch {
      setError(
        "We couldn't submit your information right now. Please try again.",
      );
    } finally {
      locked.current = false;
      setChallenge("");
      setReset((v) => v + 1);
    }
  }
  return { submit, challenge, setChallenge, reset, error };
}
