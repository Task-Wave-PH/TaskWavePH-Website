"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  acknowledgmentCookie,
  hasCookieAcknowledgment,
} from "@/lib/cookie-notice";

const noticeEvent = "taskwaveph:cookie-notice";
function subscribe(listener: () => void) {
  window.addEventListener(noticeEvent, listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(noticeEvent, listener);
    window.removeEventListener("focus", listener);
  };
}
function acknowledged() {
  try {
    return hasCookieAcknowledgment(document.cookie);
  } catch {
    return false;
  }
}

export function CookieNotice({ privacyHref }: { privacyHref: string }) {
  const pathname = usePathname();
  const stored = useSyncExternalStore(subscribe, acknowledged, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin") || pathname.startsWith("/dev-preview"))
    return null;
  function acknowledge() {
    try {
      document.cookie = acknowledgmentCookie(location.protocol === "https:");
    } catch {
      /* The notice still dismisses when browser storage is unavailable. */
    }
    setDismissed(true);
    window.dispatchEvent(new Event(noticeEvent));
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="link"
            className="min-h-11 px-0 text-muted-foreground hover:text-brand-navy"
          />
        }
      >
        Cookie information
      </SheetTrigger>
      {!stored && !dismissed && (
        <aside
          aria-label="Cookie notice"
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-2xl border bg-background p-5 text-left text-sm text-foreground shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[420px]"
        >
          <div className="flex items-center gap-3">
            <Cookie
              aria-hidden="true"
              className="size-5 shrink-0 text-primary"
            />
            <h2 className="font-semibold">
              A little information about cookies
            </h2>
          </div>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We use essential cookies for security and submission confirmations.
            We also remember when you dismiss this notice. Cookie-free visitor
            statistics help us improve public pages. We do not use advertising
            trackers.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button className="min-h-11 px-5" onClick={acknowledge}>
              Got it
            </Button>
            <SheetTrigger
              render={<Button variant="outline" className="min-h-11 px-4" />}
            >
              Cookie information
            </SheetTrigger>
          </div>
        </aside>
      )}
      <SheetContent className="w-full! sm:max-w-lg! overflow-y-auto">
        <SheetHeader className="gap-3 p-6 pr-16">
          <SheetTitle className="text-2xl font-semibold text-brand-navy">
            Cookie information
          </SheetTitle>
          <SheetDescription className="leading-relaxed">
            Small browser records help the website work and remember your notice
            acknowledgment.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-6 pb-8 leading-relaxed">
          <div className="rounded-xl bg-secondary p-4">
            <div className="flex items-center gap-2 font-medium text-brand-navy">
              <ShieldCheck aria-hidden="true" className="size-5" />
              Essential functions
            </div>
            <p className="mt-2 text-muted-foreground">
              Confirmation receipts last 10 minutes after a successful
              submission. Staff sign-in uses authentication cookies when
              enabled. Security services help protect forms from abuse.
            </p>
          </div>
          <section>
            <h3 className="font-semibold">Remembering this notice</h3>
            <p className="mt-2 text-muted-foreground">
              The notice acknowledgment is stored for 180 days. It contains only
              a notice version, not your name or application details. You can
              reopen this information from the footer at any time.
            </p>
          </section>
          <section>
            <h3 className="font-semibold">Your browser controls</h3>
            <p className="mt-2 text-muted-foreground">
              You can remove or block cookies through your browser settings.
              Blocking essential cookies can prevent staff sign-in or submission
              confirmation pages from working. If notice storage is blocked, the
              notice may reappear.
            </p>
          </section>
          <section>
            <h3 className="font-semibold">Website visitor statistics</h3>
            <p className="mt-2 text-muted-foreground">
              We use cookie-free analytics for public-page visitor statistics,
              such as page views, referral sources, and device types. It is not
              used to record your form entries or private staff activity. We do
              not use advertising trackers. Acknowledging this notice does not
              give recruitment consent or submit a form.
            </p>
          </section>
          <Link
            href={`${privacyHref}#cookies`}
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            Read the full cookie and privacy information
          </Link>
          <Button
            variant="outline"
            className="min-h-11 px-5"
            onClick={() => setOpen(false)}
          >
            Close information
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
