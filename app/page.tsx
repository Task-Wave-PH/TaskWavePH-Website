import type { Metadata } from "next";
import Image from "next/image";
import heroImage from "@/public/images/homepage/team-collaboration.webp";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { MotionReveal } from "@/components/layout/motion-reveal";
import { Footer } from "@/components/layout/footer";
import { BusinessLink } from "@/components/layout/business-link";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { serviceDetails } from "@/features/service-content";
import { getSiteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/page-metadata";
import { companyStructuredData, serializeJsonLd } from "@/lib/seo";
import { areas, themes, steps, companyLocation } from "@/lib/brand-content";

export const metadata: Metadata = {
  ...pageMetadata(
    "Philippine Outsourcing & Business Support",
    "Support your global business with Philippine talent. Explore TaskWavePH customer support, digital marketing, web development, virtual assistance, and more.",
    "/",
  ),
  title: { absolute: "Philippine Outsourcing & Business Support | TaskWavePH" },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(companyStructuredData(getSiteUrl())),
        }}
      />
      <Header query={query} />
      <main id="main-content">
        <section
          aria-labelledby="hero-title"
          className="relative isolate overflow-hidden bg-white"
        >
          <div className="mx-auto grid max-w-[1180px] items-center gap-5 px-5 pt-10 sm:px-8 sm:pt-14 lg:min-h-[620px] lg:grid-cols-2 lg:gap-12 lg:py-16">
            <MotionReveal className="relative z-10 lg:pr-4">
              <p className="mb-5 max-w-sm text-sm font-medium leading-relaxed text-primary">
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
              <p className="mt-6 max-w-lg text-lg font-medium text-brand-navy">
                We handle the tasks. You focus on growth.
              </p>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                Bring skilled Philippine professionals and efficient processes
                into your business with TaskWavePH’s outsourcing and business
                support services.
              </p>
              <div className="mt-7 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <BusinessLink href={enquiryHref} />
                <Link
                  href={getTrackedHref("/areas-of-work", query)}
                  className={buttonVariants({
                    variant: "link",
                    className: "min-h-12 px-0",
                  })}
                >
                  Explore Our Services{" "}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </MotionReveal>
            <figure className="relative -mx-5 min-w-0 sm:-mx-8 lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:w-[68%]">
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary lg:h-full lg:aspect-auto">
                <Image
                  src={heroImage}
                  placeholder="blur"
                  alt="Illustrative scene of Filipino professionals collaborating around a laptop"
                  fill
                  preload
                  sizes="(max-width: 1023px) 100vw, 68vw"
                  className="object-cover object-[65%_center]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#fff_0%,transparent_24%)] lg:bg-[linear-gradient(to_right,#fff_0%,#fff_12%,rgba(255,255,255,0.9)_25%,rgba(255,255,255,0.35)_45%,transparent_62%)]"
                />
              </div>
              <figcaption className="absolute inset-x-5 bottom-5 flex max-w-sm items-center gap-4 rounded-xl border border-white/60 bg-white/95 p-4 shadow-sm sm:inset-x-8 sm:bottom-8 lg:left-auto lg:right-[max(32px,calc((100vw-1116px)/2))] lg:bottom-10">
                <div className="relative aspect-[2/1] w-16 shrink-0 overflow-hidden">
                  <Image
                    src="/logo/taskwaveph-symbol.png"
                    alt="TaskWavePH TW wave monogram"
                    fill
                    sizes="64px"
                    className="object-cover object-center"
                  />
                </div>
                <p className="text-sm font-medium leading-relaxed text-brand-navy">
                  Your Partner in Outsourcing.
                  <br />
                  Your Advantage in Growth.
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-labelledby="themes-title"
          className="bg-brand-navy text-white"
        >
          <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-8 sm:py-10">
            <h2 id="themes-title" className="sr-only">
              People and processes behind your progress.
            </h2>
            <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {themes.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <Icon
                    aria-hidden="true"
                    className="mt-1 size-7 shrink-0 text-brand-cyan"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="services-title"
          className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
        >
          <div className="grid items-end gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-primary">Our services</p>
              <h2
                id="services-title"
                className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                Business support across your operations.
              </h2>
            </div>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              From customer conversations to digital experiences, explore where
              TaskWavePH can support your team.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map(({ icon: Icon, title, description }, index) => {
              const service = serviceDetails[index];
              return (
                <MotionReveal
                  key={title}
                  className="h-full"
                  delay={(index % 3) * 40}
                >
                  <Link
                    href={`${getTrackedHref("/areas-of-work", query)}#${service.id}`}
                    aria-labelledby={`home-service-${service.id}`}
                    className="public-service-card group block h-full rounded-xl"
                  >
                    <Card className="h-full gap-0 overflow-hidden py-0 transition-colors group-hover:ring-primary/40 motion-reduce:transition-none">
                      <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                            <Icon aria-hidden="true" className="size-5" />
                          </span>
                          <h3
                            id={`home-service-${service.id}`}
                            className="pt-1 text-lg font-semibold leading-snug"
                          >
                            {title}
                          </h3>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                        <span
                          aria-hidden="true"
                          className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-primary"
                        >
                          Explore service <ArrowRight className="size-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </MotionReveal>
              );
            })}
          </div>
          <Link
            href={getTrackedHref("/areas-of-work", query)}
            className={buttonVariants({
              variant: "link",
              className: "mt-6 min-h-11 px-0",
            })}
          >
            Explore Our Services{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <section
          aria-labelledby="intro-title"
          className="border-y bg-secondary/60"
        >
          <div className="mx-auto grid max-w-[1180px] gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-primary">
                Built around people and progress
              </p>
              <h2
                id="intro-title"
                className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl"
              >
                Support for the work.
                <br />
                <span className="text-primary">Space for what’s next.</span>
              </h2>
              <p className="mt-5 flex items-start gap-2 text-sm font-medium text-brand-navy">
                <MapPin
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
                <span>{companyLocation}</span>
              </p>
            </div>
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
                Meet TaskWavePH{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="steps-title"
          className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
        >
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2
            id="steps-title"
            className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl"
          >
            Let’s find the support your business needs.
          </h2>
          <ol className="mt-8 grid gap-7 md:grid-cols-3 md:gap-8">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <li key={title}>
                <MotionReveal
                  className="relative border-t pt-6"
                  delay={index * 40}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
                    >
                      0{index + 1}
                    </span>
                    <Icon aria-hidden="true" className="size-7 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </MotionReveal>
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
            See How It Works{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-[1180px] px-5 pb-12 sm:px-8 sm:pb-16 lg:pb-20"
        >
          <MotionReveal>
            <Card className="bg-brand-navy py-0 text-white ring-0">
              <CardContent className="grid justify-items-start gap-7 px-6 py-9 sm:px-10 sm:py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-10">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80">
                    Let’s grow together
                  </p>
                  <h2
                    id="cta-title"
                    className="mt-3 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl"
                  >
                    Make more room for business growth.
                  </h2>
                  <p className="mt-3 max-w-lg leading-relaxed text-white/80">
                    Tell us where your team needs support. Let’s discuss how
                    TaskWavePH can help.
                  </p>
                </div>
                <BusinessLink href={enquiryHref} light />
              </CardContent>
            </Card>
          </MotionReveal>
        </section>
      </main>
      <Footer query={query} />
    </>
  );
}
