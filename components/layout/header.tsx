import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { BusinessLink } from "./business-link";
import { ApplyLink } from "./apply-link";
import { SiteNavigation } from "./site-navigation";
import {
  getApplyHref,
  getTrackedHref,
  getTracking,
  type TrackingQuery,
} from "@/features/applications/tracking";

export function Header({
  applyHref,
  query = {},
  audience = "business",
}: {
  applyHref?: string;
  audience?: "business" | "applicant";
  query?: TrackingQuery;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8 lg:h-20"
      >
        <Link
          href={getTrackedHref("/", query)}
          aria-label="TaskWavePH home"
          className="shrink-0 rounded-sm"
        >
          <BrandLogo eager />
        </Link>
        <SiteNavigation
          query={getTracking(query)}
          audience={audience}
          ctaHref={
            audience === "applicant"
              ? (applyHref ?? getApplyHref(query))
              : getTrackedHref("/business-enquiry", query)
          }
        />
        <div className="hidden lg:block">
          {audience === "applicant" ? (
            <ApplyLink href={applyHref ?? getApplyHref(query)} compact />
          ) : (
            <BusinessLink
              href={getTrackedHref("/business-enquiry", query)}
              compact
            />
          )}
        </div>
      </nav>
    </header>
  );
}
