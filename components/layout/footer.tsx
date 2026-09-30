import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-4">
          <Link
            href="/"
            aria-label="TaskWavePH home"
            className="inline-block rounded-sm"
          >
            <BrandLogo />
          </Link>
          <p className="max-w-sm leading-relaxed">
            Philippine talent. Global possibilities.
            <br />
            Outsourcing and business support, built around people.
          </p>
        </div>
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center self-start underline underline-offset-4 hover:text-brand-navy sm:self-auto"
        >
          Privacy notice
        </Link>
      </div>
    </footer>
  );
}
