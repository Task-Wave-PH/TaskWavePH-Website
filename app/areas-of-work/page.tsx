import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { ContentPage } from "@/components/layout/content-page";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { serviceDetails } from "@/features/service-content";
import { pageMetadata } from "@/lib/page-metadata";
import { cn } from "@/lib/utils";

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
      eyebrow="Our services"
      title="Support for the work that moves your business."
      description="Bring Philippine talent and business support into your operations. Explore our six service areas and tell us where your team needs help."
    >
      <nav aria-label="Jump to a service" className="flex flex-wrap gap-2">
        {serviceDetails.map(({ id, title }) => (
          <Link
            key={id}
            href={`#${id}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-11 h-auto whitespace-normal px-4 py-3 text-left",
            )}
          >
            {title}
          </Link>
        ))}
      </nav>
      <div className="space-y-12 sm:space-y-16">
        {serviceDetails.map(
          ({ id, title, image, headline, description, examples }, index) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              tabIndex={-1}
              className="scroll-mt-8 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-primary"
            >
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <div
                  className={cn(
                    "relative isolate flex aspect-square items-center justify-center overflow-hidden rounded-[32px] bg-secondary p-4 sm:p-6",
                    index % 2 === 1 && "lg:order-2",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-16 -z-10 size-64 rounded-full border-[24px] border-brand-cyan/10"
                  />
                  <Image
                    src={`/images/services/${image}.webp`}
                    alt=""
                    width={1254}
                    height={1254}
                    sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 64px), 558px"
                    className="h-auto w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <h2
                    id={`${id}-title`}
                    className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                  >
                    {headline}
                  </h2>
                  <p className="mt-5 leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <h3 className="mt-6 text-sm font-semibold">
                    Examples of support to discuss
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {examples.map((example) => (
                      <li
                        key={example}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        {example}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={getTrackedHref("/business-enquiry", query)}
                    className={buttonVariants({
                      variant: "link",
                      className: "mt-6 min-h-11 h-auto whitespace-normal px-0",
                    })}
                  >
                    Discuss {title}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  </Link>
                </div>
              </div>
              {index < serviceDetails.length - 1 && (
                <Separator className="mt-12 sm:mt-16" />
              )}
            </section>
          ),
        )}
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        These examples are starting points for a conversation. Services,
        responsibilities, and working arrangements are discussed and agreed
        based on your business needs.
      </p>
    </ContentPage>
  );
}
