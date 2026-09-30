import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ApplyLink } from "./apply-link";

export function Header({
  applyHref = "/apply",
  landingNavigation = false,
}: {
  applyHref?: string;
  landingNavigation?: boolean;
}) {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-5 py-4 sm:px-8"
      >
        <Link
          href="/"
          aria-label="TaskWavePH home"
          className="shrink-0 rounded-sm"
        >
          <BrandLogo eager />
        </Link>
        {landingNavigation && (
          <div className="hidden items-center gap-8 text-sm font-medium text-brand-navy lg:flex">
            <a href="#areas-of-work" className="py-3 hover:text-primary">
              Areas of Work
            </a>
            <a href="#how-it-works" className="py-3 hover:text-primary">
              How It Works
            </a>
            <a href="#about" className="py-3 hover:text-primary">
              About
            </a>
          </div>
        )}
        <ApplyLink href={applyHref} compact />
      </nav>
    </header>
  );
}
