import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import type { TrackingQuery } from "@/features/applications/tracking";

export function PolicyPage({
  query,
  title,
  description,
  status,
  sections,
  children,
}: {
  query: TrackingQuery;
  title: string;
  description: string;
  status: string;
  sections: readonly { id: string; title: string }[];
  children: ReactNode;
}) {
  return (
    <>
      <Header query={query} />
      <main id="main-content">
        <section className="border-b bg-secondary/70">
          <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
              Trust & transparency
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="rounded-full border bg-background px-3 py-1">
                {status}
              </span>
              <span>
                Last updated <time dateTime="2026-10-01">October 1, 2026</time>
              </span>
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:py-16">
          <aside className="min-w-0">
            <nav
              aria-label="On this page"
              className="rounded-xl border bg-secondary/40 p-5 lg:sticky lg:top-6"
            >
              <h2 className="mb-3 text-sm font-semibold">On this page</h2>
              <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {sections.map(({ id, title }, index) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm leading-relaxed text-muted-foreground hover:bg-background hover:text-primary"
                    >
                      <span
                        aria-hidden="true"
                        className="text-xs tabular-nums text-primary"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
          <article className="min-w-0 max-w-3xl space-y-10 leading-relaxed text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </article>
        </div>
      </main>
      <Footer query={query} />
    </>
  );
}
