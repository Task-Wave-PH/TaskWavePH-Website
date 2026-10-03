"use client";

import { useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export function LogoutConfirmation({
  open,
  onOpenChange,
  onLogout,
  finalFocus,
  preview = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
  finalFocus: RefObject<HTMLElement | null>;
  preview?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const cancel = useRef<HTMLButtonElement>(null);
  function changeOpen(value: boolean) {
    if (pending.current) return;
    setError("");
    onOpenChange(value);
  }
  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await onLogout();
      onOpenChange(false);
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent initialFocus={cancel} finalFocus={finalFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {preview ? "Exit preview?" : "Log out?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {preview
              ? "You’ll leave the local preview. Unsaved sample changes will be lost."
              : "You’ll be signed out of your staff account. Any unsaved changes will be lost."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <Button
            ref={cancel}
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => changeOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="min-h-11"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? "Signing out…" : preview ? "Exit preview" : "Log out"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
