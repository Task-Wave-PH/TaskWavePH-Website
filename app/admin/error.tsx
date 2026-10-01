"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Unable to load administration</h1>
      <p className="mt-4">
        Your access may have changed, or the service is temporarily unavailable.
        Sign in again or retry.
      </p>
      <Button className="mt-5 min-h-11" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
