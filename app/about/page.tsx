import Link from "next/link";
import { MotionReveal } from "@/components/layout/motion-reveal";
import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { themes, companyLocation } from "@/lib/brand-content";

export const metadata = pageMetadata(
  "About Our Philippine Outsourcing Agency",
  "Meet TaskWavePH, a Philippine-based outsourcing and business support agency helping global businesses streamline operations and grow.",
  "/about",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <ContentPage
      query={query}
      eyebrow={"TaskWavePH"}
      title={"Your partner in business progress."}
      description={
        "Discover TaskWavePH, a Philippine outsourcing agency connecting global businesses with skilled talent and efficient processes."
      }
    >
      <section className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Who we are.</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            TaskWavePH is a Philippine-based outsourcing and business support
            agency that helps global businesses streamline operations, reduce
            costs, and scale faster.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We deliver support, marketing, and web solutions through skilled
            professionals and efficient processes.
          </p>
          <p className="mt-6 flex items-start gap-2 text-sm font-medium text-brand-navy">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <span>{companyLocation}</span>
          </p>
        </div>
        <figure className="rounded-2xl bg-secondary p-5 sm:p-8">
          <div className="relative mx-auto aspect-[2/1] max-w-[390px] overflow-hidden">
            <Image
              src="/logo/taskwaveph-symbol.png"
              alt="TaskWavePH TW wave monogram"
              fill
              sizes="(max-width: 639px) calc(100vw - 104px), 390px"
              className="object-cover object-center"
            />
          </div>
          <figcaption className="mt-4 text-center font-medium text-brand-navy">
            Outsource. Optimize. Grow.
          </figcaption>
        </figure>
      </section>
      <section aria-labelledby="themes-title">
        <h2 id="themes-title" className="text-2xl font-semibold">
          What guides our work
        </h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {themes.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <MotionReveal className="h-full">
                <Card className="h-full py-0">
                  <CardContent className="p-6">
                    <Icon aria-hidden="true" className="size-7 text-primary" />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              </MotionReveal>
            </li>
          ))}
        </ul>
      </section>
      <section className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">
          Rooted in the Philippines
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          Local talent. A global outlook.
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          From Dagupan City, Pangasinan, TaskWavePH connects Philippine talent
          with the work businesses need to move forward. Our services span
          customer support, digital marketing, web development, virtual
          assistance, administration, and sales support.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Collaboration starts with understanding your priorities. We discuss
          the tasks, skills, and working arrangements that could suit your team,
          then clarify the next steps together.
        </p>
        <Link
          href={getTrackedHref("/areas-of-work", query)}
          className={buttonVariants({
            variant: "link",
            className: "mt-4 min-h-11 px-0",
          })}
        >
          Explore our services
        </Link>
      </section>
    </ContentPage>
  );
}
