"use client";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { StatusPage } from "@/components/layout/status-page";
import { Button, buttonVariants } from "@/components/ui/button";

export function AcceptInvitation() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const accept = useAction(api.staffInvitations.accept);
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"checking" | "denied" | "failed">(
    "checking",
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isLoading || started.current) return;
    if (!isAuthenticated) return;
    started.current = true;
    void accept({})
      .then((accepted) => {
        if (accepted) router.replace("/admin");
        else setState("denied");
      })
      .catch(() => setState("failed"));
  }, [isAuthenticated, isLoading, accept, router, attempt]);
  const displayState = !isLoading && !isAuthenticated ? "denied" : state;
  return (
    <StatusPage
      kind="access"
      title={
        displayState === "checking"
          ? "Verifying your invitation…"
          : displayState === "failed"
            ? "We couldn’t verify your invitation."
            : "This invitation isn’t available."
      }
      description={
        displayState === "checking"
          ? "Please wait while we confirm your staff account and workspace permissions."
          : displayState === "failed"
            ? "The account service may be unavailable. Your permissions have not been changed. Try again."
            : "The invitation may be expired, cancelled, or linked to a different account. Ask a TaskWavePH owner for help."
      }
      homeHref={process.env.NEXT_PUBLIC_SITE_URL || "/"}
    >
      {displayState === "checking" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Checking staff access…
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          {displayState === "failed" && (
            <Button
              className="min-h-11 px-5"
              onClick={() => {
                started.current = false;
                setState("checking");
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </Button>
          )}
          <Link
            href="/admin/sign-in"
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-5",
            })}
          >
            Back to sign in
          </Link>
        </div>
      )}
    </StatusPage>
  );
}
