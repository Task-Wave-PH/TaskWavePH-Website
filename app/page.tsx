import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BusinessLink } from "@/components/layout/business-link";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { getSiteUrl } from "@/lib/env";
import { areas, themes, steps } from "@/lib/brand-content";

const title = "TaskWavePH | Outsourcing & Business Support";
const description =
  "Philippine talent, efficient processes, and outsourcing services to support your business. Explore customer support, marketing, web development, and more.";
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title,
    description,
    url: getSiteUrl(),
    type: "website",
    locale: "en_PH",
    siteName: "TaskWavePH",
  },
  twitter: { card: "summary", title, description },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const enquiryHref = getTrackedHref("/business-enquiry", query);
  return (
    <>
      <Header query={query} />
      <main id="main-content">
        <section
          aria-labelledby="hero-title"
          className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div>
              <p className="mb-5 text-sm font-medium text-primary">
                Philippine talent. Business support. Global growth.
              </p>
              <h1
                id="hero-title"
                className="text-[2.5rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[4rem]"
              >
                Outsource.
                <br />
                Optimize.
                <br />
                <span className="text-primary">Grow.</span>
              </h1>
              <p className="mt-6 text-lg font-medium text-brand-navy">
                We handle the tasks. You focus on growth.
              </p>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                Bring skilled Philippine professionals and efficient processes
                into your business with TaskWavePH’s outsourcing and business
                support services.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <BusinessLink href={enquiryHref} />
                <Link
                  href={getTrackedHref("/areas-of-work", query)}
                  className={buttonVariants({
                    variant: "link",
                    className: "min-h-12 px-0",
                  })}
                >
                  Explore Our Services
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
            <figure className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] rounded-tr-[80px] bg-secondary px-6 py-10 sm:px-10 lg:min-h-[400px] lg:rounded-tr-[110px]">
              <div className="relative aspect-[2/1] w-full max-w-[390px] overflow-hidden">
                <Image
                  src="/logo/taskwaveph-symbol.png"
                  alt="TaskWavePH TW wave monogram"
                  fill
                  preload
                  sizes="(max-width: 639px) calc(100vw - 88px), 390px"
                  className="object-cover object-center"
                />
              </div>
              <div
                aria-hidden="true"
                className="my-7 h-1 w-12 rounded-full bg-brand-cyan"
              />
              <figcaption className="max-w-xs text-center text-sm font-medium leading-relaxed text-brand-navy">
                Your Partner in Outsourcing.
                <br />
                Your Advantage in Growth.
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          aria-labelledby="intro-title"
          className="border-y bg-secondary"
        >
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <h2
              id="intro-title"
              className="text-3xl font-semibold leading-tight"
            >
              Support for the work.
              <br />
              <span className="text-primary">Space for what’s next.</span>
            </h2>
            <div>
              <p className="leading-relaxed text-muted-foreground">
                TaskWavePH is a Philippine-based outsourcing and business
                support agency that helps global businesses streamline
                operations, reduce costs, and scale faster. We deliver support,
                marketing, and web solutions through skilled professionals and
                efficient processes.
              </p>
              <Link
                href={getTrackedHref("/about", query)}
                className={buttonVariants({
                  variant: "link",
                  className: "mt-4 min-h-11 px-0",
                })}
              >
                Meet TaskWavePH
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="services-title"
          className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20"
        >
          <p className="text-sm font-semibold text-primary">Our services</p>
          <h2 id="services-title" className="mt-3 text-3xl font-semibold">
            Business support across your operations.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            From customer conversations to digital experiences, explore where
            TaskWavePH can support your team.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="h-full py-0">
                <CardContent className="p-6">
                  <Icon aria-hidden="true" className="size-7 text-primary" />
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link
            href={getTrackedHref("/areas-of-work", query)}
            className={buttonVariants({
              variant: "link",
              className: "mt-6 min-h-11 px-0",
            })}
          >
            Explore Our Services
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
        <section
          aria-labelledby="themes-title"
          className="bg-brand-navy text-white"
        >
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
            <h2 id="themes-title" className="text-3xl font-semibold text-white">
              People and processes behind your progress.
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {themes.map(({ icon: Icon, title }) => (
                <li key={title}>
                  <Icon aria-hidden="true" className="size-7 text-brand-cyan" />
                  <h3 className="mt-4 text-lg font-medium text-white">
                    {title}
                  </h3>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section
          aria-labelledby="steps-title"
          className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20"
        >
          <h2 id="steps-title" className="text-3xl font-semibold">
            Let’s find the support your business needs.
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map(({ title, description }, index) => (
              <li key={title} className="border-t pt-6">
                <p aria-hidden="true" className="font-semibold text-primary">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href={getTrackedHref("/how-it-works", query)}
            className={buttonVariants({
              variant: "link",
              className: "mt-6 min-h-11 px-0",
            })}
          >
            See How It Works
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <Card className="bg-primary py-0 text-primary-foreground ring-0">
            <CardContent className="flex flex-col items-start gap-7 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  id="cta-title"
                  className="text-2xl font-semibold text-white sm:text-3xl"
                >
                  Make more room for business growth.
                </h2>
                <p className="mt-3 max-w-lg leading-relaxed">
                  Tell us where your team needs support. Let’s discuss how
                  TaskWavePH can help.
                </p>
              </div>
              <BusinessLink href={enquiryHref} light />
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer query={query} />
    </>
  );
}
