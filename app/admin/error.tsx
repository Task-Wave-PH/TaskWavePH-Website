"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-brand-navy">
        Unable to load this workspace
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Check your connection and staff access, then try again.
      </p>
      <Button className="min-h-11 self-start px-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
