"use client";

import { useRef, useState } from "react";
import { LogoutConfirmation } from "./logout-confirmation";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [confirm, setConfirm] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <StatusPage
      kind="access"
      title="Access denied"
      description="Your account is not approved for staff access. Ask your TaskWavePH administrator to approve this account, or sign out to use a different one."
      homeHref={process.env.NEXT_PUBLIC_SITE_URL || "/"}
    >
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4">
        <span className="shrink-0">
          <UserButton />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="break-all text-sm font-medium text-brand-navy">
            {user?.primaryEmailAddress?.emailAddress || "Staff account"}
          </p>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Creating an account does not automatically grant access to applicant or
        business records.
      </p>
      <Button
        ref={trigger}
        className="min-h-11 w-full gap-2 px-5 sm:w-fit"
        variant="outline"
        onClick={() => setConfirm(true)}
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sign out
      </Button>
      <LogoutConfirmation
        open={confirm}
        onOpenChange={setConfirm}
        finalFocus={trigger}
        onLogout={() => signOut({ redirectUrl: "/admin/sign-in" })}
      />
    </StatusPage>
  );
}
