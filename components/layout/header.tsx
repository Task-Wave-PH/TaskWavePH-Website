import Link from "next/link";
import { BrandLogo } from "./brand-logo";
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
}: {
  applyHref?: string;
  query?: TrackingQuery;
}) {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-8"
      >
        <Link
          href={getTrackedHref("/", query)}
          aria-label="TaskWavePH home"
          className="shrink-0 rounded-sm"
        >
          <BrandLogo eager />
        </Link>
        <SiteNavigation query={getTracking(query)} />
        <ApplyLink href={applyHref ?? getApplyHref(query)} compact />
      </nav>
    </header>
  );
}
