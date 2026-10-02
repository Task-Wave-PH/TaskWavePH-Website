import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { companyLocation } from "@/lib/brand-content";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { BrandLogo } from "./brand-logo";
import { CookieNotice } from "./cookie-notice";
import { serviceDetails } from "@/features/service-content";

function FooterLinkGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <details className="group border-t py-2 sm:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="pb-3">{children}</div>
      </details>
      <div className="hidden sm:block">
        <h2 className="mb-3 font-semibold text-brand-navy">{title}</h2>
        {children}
      </div>
    </>
  );
}

export function Footer({ query = {} }: { query?: TrackingQuery }) {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1180px] gap-4 px-5 py-10 sm:gap-10 sm:py-12 text-sm text-muted-foreground sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-14 lg:py-16">
        <div className="space-y-5 sm:col-span-2 lg:col-span-1">
          <Link
            href={getTrackedHref("/", query)}
            aria-label="TaskWavePH home"
            className="inline-block rounded-sm"
          >
            <BrandLogo />
          </Link>
          <p className="text-lg font-semibold text-brand-navy">
            Outsource. Optimize. Grow.
          </p>
          <p className="max-w-sm leading-relaxed">
            Philippine talent and business support for global teams. We handle
            the tasks. You focus on growth.
          </p>
          <p className="flex max-w-sm items-start gap-2 leading-relaxed">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span>{companyLocation}</span>
          </p>
        </div>
        <nav aria-label="Footer company navigation">
          <FooterLinkGroup title="Explore TaskWavePH">
            <ul className="space-y-1">
              {[
                ["About TaskWavePH", "/about"],
                ["How it works", "/how-it-works"],
                ["Work with us", "/business-enquiry"],
                ["Careers", "/careers"],
                ["Applicant form", "/apply"],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link
                    href={getTrackedHref(path, query)}
                    className="inline-flex min-h-11 items-center hover:text-primary hover:underline underline-offset-4"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterLinkGroup>
        </nav>
        <nav aria-label="Footer services navigation">
          <FooterLinkGroup title="Our services">
            <ul className="space-y-1">
              {serviceDetails.map(({ id, title }) => (
                <li key={id}>
                  <Link
                    href={`${getTrackedHref("/areas-of-work", query)}#${id}`}
                    className="inline-flex min-h-11 items-center leading-relaxed hover:text-primary hover:underline underline-offset-4"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterLinkGroup>
        </nav>
      </div>
      <div className="border-t bg-secondary/50">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-5 text-sm text-muted-foreground sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} TaskWavePH. All rights reserved.</p>
          <nav
            aria-label="Footer policy navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-1"
          >
            <Link
              href={getTrackedHref("/privacy", query)}
              className="inline-flex min-h-11 items-center hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              href={getTrackedHref("/terms", query)}
              className="inline-flex min-h-11 items-center hover:text-primary underline underline-offset-4"
            >
              Website Terms
            </Link>
            <CookieNotice privacyHref={getTrackedHref("/privacy", query)} />
          </nav>
        </div>
      </div>
    </footer>
  );
}
