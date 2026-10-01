import { LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

export function AccessLoading({
  message = "Checking staff access…",
}: {
  message?: string;
}) {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="flex min-h-svh items-center justify-center bg-secondary/50 px-5 py-8"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <BrandLogo eager />
        <div
          role="status"
          className="flex items-center justify-center gap-3 text-sm text-brand-navy"
        >
          <LoaderCircle
            aria-hidden="true"
            className="size-5 shrink-0 text-primary motion-safe:animate-spin"
          />
          <span>{message}</span>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Your staff workspace will be ready shortly.
        </p>
      </div>
    </main>
  );
}
