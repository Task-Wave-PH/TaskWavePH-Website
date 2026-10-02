import Link from "next/link";
import { Compass, ShieldCheck, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Card, CardContent } from "@/components/ui/card";

export function StatusPage({
  kind,
  title,
  description,
  homeHref,
  children,
}: {
  kind: "access" | "not-found";
  title: string;
  description: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  const Icon = kind === "access" ? ShieldCheck : Compass;
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-1 flex-col bg-secondary/40 px-5 py-5 sm:px-8 sm:py-8 lg:py-10"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href={homeHref}
          aria-label="TaskWavePH home"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <BrandLogo eager />
        </Link>
        <span className="hidden text-xs font-medium text-muted-foreground sm:block sm:text-sm">
          {kind === "access" ? "Staff workspace" : "TaskWavePH"}
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 items-center py-6 sm:py-10 lg:max-w-5xl lg:py-16">
        <Card className="min-w-0 w-full gap-0 rounded-2xl py-0 shadow-sm">
          <CardContent className="grid min-w-0 p-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div
              aria-hidden="true"
              className="relative flex min-h-32 items-center justify-center overflow-hidden bg-brand-navy p-5 text-white sm:min-h-40 sm:p-6 lg:min-h-96 lg:p-8"
            >
              <div className="absolute -bottom-32 -left-12 size-80 rounded-full border-[32px] border-primary/25" />
              <div className="absolute -right-20 -top-24 size-72 rounded-full border-[32px] border-brand-cyan/15" />
              <div className="relative flex items-center gap-5 lg:flex-col lg:gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:size-16">
                  <Icon
                    className="size-6 text-brand-cyan sm:size-8"
                    strokeWidth={1.5}
                  />
                </span>
                {kind === "not-found" ? (
                  <span className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                    404
                  </span>
                ) : (
                  <span className="text-sm font-medium tracking-wide">
                    Approved staff only
                  </span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-5 p-5 sm:gap-6 sm:p-8 lg:p-12">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {kind === "access" ? "Staff access" : "Page not found"}
                </p>
                <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-brand-navy sm:text-3xl lg:text-4xl">
                  {title}
                </h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="mx-auto flex items-center gap-2 text-center text-xs text-muted-foreground">
        Outsource. Optimize. Grow.
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </p>
    </main>
  );
}
