import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import { themes } from "@/lib/brand-content";

export const metadata = pageMetadata(
  "About",
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
      title={"People behind the progress."}
      description={"Philippine talent. Global possibilities."}
    >
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">
            Your partner in outsourcing.
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            TaskWavePH is a Philippine-based outsourcing and business support
            agency that helps global businesses streamline operations, reduce
            costs, and scale faster.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We deliver support, marketing, and web solutions through skilled
            professionals and efficient processes.
          </p>
        </div>
        <figure className="rounded-2xl bg-secondary p-8">
          <div className="relative mx-auto aspect-[2/1] max-w-[390px] overflow-hidden">
            <Image
              src="/logo/taskwaveph-symbol.png"
              alt="TaskWavePH TW wave monogram"
              fill
              sizes="(max-width: 639px) calc(100vw - 104px), 390px"
              className="object-cover object-center"
            />
          </div>
          <figcaption className="mt-6 text-center font-medium text-brand-navy">
            Outsource. Optimize. Grow.
          </figcaption>
        </figure>
      </section>
      <section aria-labelledby="themes-title">
        <h2 id="themes-title" className="text-2xl font-semibold">
          What guides our work
        </h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map(({ icon: Icon, title }) => (
            <li key={title}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <Icon aria-hidden="true" className="size-7 text-primary" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <Card className="rounded-none border-l-4 border-brand-cyan bg-secondary ring-0">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">
            Your Partner in Outsourcing.
            <br />
            <span className="text-primary">Your Advantage in Growth.</span>
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We handle the tasks. You focus on growth.
          </p>
          <Link
            href={getTrackedHref("/areas-of-work", query)}
            className={buttonVariants({
              variant: "link",
              className: "mt-4 min-h-11 px-0",
            })}
          >
            Discover our areas of work
          </Link>
        </CardContent>
      </Card>
    </ContentPage>
  );
}
