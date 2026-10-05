"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

/** Protect editor links without patching Next.js routing or browser history. */
export function useUnsavedChanges(dirty: boolean) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const dirtyRef = useRef(dirty);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  const trigger = useRef<HTMLElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current || leaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function click(event: MouseEvent) {
      if (
        !dirtyRef.current ||
        leaving.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (
        url.origin === location.origin &&
        url.pathname === location.pathname &&
        url.search === location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      trigger.current = anchor;
      setDestination(url.href);
    }
    function returned() {
      leaving.current = false;
    }
    window.addEventListener("pageshow", returned);
    // Clean editors should not disable Firefox back/forward caching.
    if (dirty) window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("pageshow", returned);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);

  function discard() {
    if (!destination || leaving.current) return;
    setDestination(null);
    const url = new URL(destination);
    if (url.origin === location.origin) {
      router.push(url.pathname + url.search + url.hash);
    } else {
      // Only document navigation needs to bypass our beforeunload handler.
      leaving.current = true;
      location.assign(url.href);
    }
  }

  const warning = (
    <AlertDialog
      open={destination !== null}
      onOpenChange={(open) => {
        if (!open) setDestination(null);
      }}
    >
      <AlertDialogContent initialFocus={cancel} finalFocus={trigger}>
        <AlertDialogHeader>
          <AlertDialogTitle>You have unsaved changes.</AlertDialogTitle>
          <AlertDialogDescription>
            Leave without saving? Your latest edits will be discarded.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            ref={cancel}
            variant="outline"
            className="min-h-11"
            onClick={() => setDestination(null)}
          >
            Keep editing
          </Button>
          <Button className="min-h-11" onClick={discard}>
            Discard changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return warning;
}
