import Link from "next/link";
import { ArrowUpRight, Waves } from "lucide-react";

export function Header({ applyHref = "/apply" }: { applyHref?: string }) {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8"
      >
        <Link
          href="/"
          aria-label="TaskWavePH home"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Waves className="size-6 text-primary" aria-hidden="true" />
          <span>
            TaskWave<span className="text-primary">PH</span>
          </span>
        </Link>
        <Link
          href={applyHref}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Apply Now <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}
