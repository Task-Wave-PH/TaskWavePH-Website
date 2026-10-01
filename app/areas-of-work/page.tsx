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
  "Services",
  "Explore TaskWavePH outsourcing services for customer support, marketing, web development, administration, and sales support.",
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
      eyebrow={"Our services"}
      title={"Support for the work that moves your business."}
      description={
        "Bring Philippine talent and business support into your operations. Explore our six service areas and tell us where your team needs help."
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
        <h2 className="text-2xl font-semibold">
          Let’s discuss your priorities.
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Tell us about the tasks, processes, and goals your team needs support
          with. We can discuss which services may fit your business.
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
