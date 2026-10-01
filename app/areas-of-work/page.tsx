import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import { areas } from "@/lib/brand-content";

export const metadata = pageMetadata(
  "Areas of Work",
  "Explore the business support services delivered by TaskWavePH and where your skills could contribute.",
  "/areas-of-work",
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
      eyebrow={"Our work"}
      title={"Where your skills can fit."}
      description={
        "Explore the work that supports our clients. These service areas describe what we do; they are not a list of current vacancies."
      }
    >
      <section aria-label="Service areas" className="grid gap-6 md:grid-cols-2">
        {areas.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardContent className="p-6 sm:p-8">
              <Icon aria-hidden="true" className="size-7 text-primary" />
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Explore your next step.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Openings vary. Visit Careers for application preparation and the
          current availability notice.
        </p>
        <Link
          href={getTrackedHref("/careers", query)}
          className={buttonVariants({
            variant: "link",
            className: "mt-4 min-h-11 px-0",
          })}
        >
          Explore careers
        </Link>
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Support for your business</h2>
        <p className="mt-4 text-muted-foreground">
          Tell us about the services your company needs.
        </p>
        <Link
          href={getTrackedHref("/business-enquiry", query)}
          className={buttonVariants({
            variant: "link",
            className: "mt-4 min-h-11 px-0",
          })}
        >
          Make a business enquiry
        </Link>
      </section>
    </ContentPage>
  );
}
