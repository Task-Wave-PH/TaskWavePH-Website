import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { ApplyLink } from "./apply-link";
import { Card, CardContent } from "@/components/ui/card";
import {
  getApplyHref,
  type TrackingQuery,
} from "@/features/applications/tracking";

export function ContentPage({
  query,
  eyebrow,
  title,
  description,
  children,
}: {
  query: TrackingQuery;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header query={query} />
      <main id="main-content">
        <section className="bg-secondary">
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-[1180px] space-y-14 px-5 py-14 sm:space-y-20 sm:px-8 sm:py-20">
          {children}
          <Card className="bg-primary py-0 text-primary-foreground ring-0">
            <CardContent className="flex flex-col items-start gap-6 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Prepare for your next move.
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed">
                  Applications are opening soon. Preview the form; your
                  information will not be sent or saved.
                </p>
              </div>
              <ApplyLink href={getApplyHref(query)} light />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer query={query} />
    </>
  );
}
