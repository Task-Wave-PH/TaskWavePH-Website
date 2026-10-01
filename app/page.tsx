import { submissionsEnabled } from "@/lib/submission-env";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplyLink } from "@/components/layout/apply-link";
import { getApplyHref, getTrackedHref } from "@/features/applications/tracking";
import { getSiteUrl } from "@/lib/env";

const description =
  "Explore BPO and business support opportunities with TaskWavePH, a Philippine-based outsourcing agency connecting skilled people with global business needs.";

export const metadata: Metadata = {
  title: "TaskWavePH | Make your next move",
  description,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: "TaskWavePH | Make your next move",
    description,
    url: getSiteUrl(),
    type: "website",
    locale: "en_PH",
    siteName: "TaskWavePH",
  },
  twitter: {
    card: "summary",
    title: "TaskWavePH | Make your next move",
    description,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const applyHref = getApplyHref(query);
  return (
    <>
      <Header query={query} />
      <main id="main-content">
        <div className="bg-secondary px-5 py-3 text-center text-xs leading-relaxed text-brand-navy sm:text-sm">
          {submissionsEnabled()
            ? "Applications are open for submission."
            : "Applications are opening soon. You can preview the form."}
        </div>

        <section
          aria-labelledby="hero-title"
          className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div>
              <h1
                id="hero-title"
                className="text-[2.5rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[4rem]"
              >
                Make your <span className="block text-primary">next move.</span>
              </h1>
              <p className="mt-6 max-w-[440px] text-base leading-relaxed text-muted-foreground sm:text-lg">
                Explore BPO and business support opportunities with TaskWavePH
                in the Philippines.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <ApplyLink href={applyHref} />
                <a
                  href={getTrackedHref("/about", query)}
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "min-h-12 gap-2 px-0 text-sm font-medium text-brand-navy hover:text-primary",
                  )}
                >
                  Meet TaskWavePH{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <figure className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] rounded-tr-[80px] bg-[#eff7ff] px-6 py-10 sm:px-10 lg:min-h-[360px] lg:rounded-tr-[110px]">
              <div className="relative aspect-[2/1] w-full max-w-[390px] overflow-hidden">
                <Image
                  src="/logo/taskwaveph-symbol.png"
                  alt="TaskWavePH TW wave monogram"
                  fill
                  preload
                  sizes="(max-width: 639px) calc(100vw - 88px), (max-width: 1023px) 390px, 390px"
                  className="object-cover object-center"
                />
              </div>
              <div
                aria-hidden="true"
                className="my-7 h-1 w-12 rounded-full bg-brand-cyan"
              />
              <figcaption className="text-center text-sm font-medium text-brand-navy sm:text-base">
                Outsource. Optimize. Grow.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8 sm:pb-20"
          aria-label="Discover TaskWavePH"
        >
          <div className="grid gap-x-14 md:grid-cols-2">
            {[
              {
                title: "Where your skills can fit.",
                text: "Explore six areas of business support, from customer conversations to digital experiences. These are work areas, not confirmed vacancies.",
                href: "/areas-of-work",
                label: "Explore areas of work",
              },
              {
                title: "Your next step, made simple.",
                text: submissionsEnabled()
                  ? "Get to know our work, prepare your details, and learn what to expect after submitting."
                  : "Get to know our work, prepare your details, and learn what to expect when applications open.",
                href: "/how-it-works",
                label: "See how it works",
              },
              {
                title: "Get ready for what’s next.",
                text: submissionsEnabled()
                  ? "Find guidance for your career journey and prepare your general application."
                  : "Find guidance for your career journey and prepare for the application preview. Applications are opening soon.",
                href: "/careers",
                label: "Explore careers",
              },
              {
                title: "People behind the progress.",
                text: "TaskWavePH brings Philippine talent and efficient processes together to support global business growth.",
                href: "/about",
                label: "About TaskWavePH",
              },
            ].map(({ title, text, href, label }) => (
              <div key={href} className="border-t py-8">
                <h2 className="text-2xl font-semibold leading-tight">
                  {title}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {text}
                </p>
                <a
                  href={getTrackedHref(href, query)}
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "mt-4 min-h-11 px-0",
                  )}
                >
                  {label}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <Card className="gap-0 rounded-2xl bg-primary py-0 text-primary-foreground ring-0">
            <CardContent className="flex flex-col items-start gap-7 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between md:gap-10">
              <div>
                <h2
                  id="cta-title"
                  className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl"
                >
                  A new chapter starts with you.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white sm:text-base">
                  Get familiar with the application form and prepare for what’s
                  next.
                </p>
              </div>
              <ApplyLink href={applyHref} light />
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer query={query} />
    </>
  );
}
