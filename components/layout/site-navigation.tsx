"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";

const pages = [
  ["Services", "/areas-of-work"],
  ["How It Works", "/how-it-works"],
  ["Careers", "/careers"],
  ["About", "/about"],
] as const;

export function SiteNavigation({
  query = {},
  audience,
  ctaHref,
}: {
  query?: TrackingQuery;
  audience: "business" | "applicant";
  ctaHref: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = (mobile: boolean) =>
    pages.map(([label, href]) => (
      <Link
        key={href}
        href={getTrackedHref(href, query)}
        aria-current={pathname === href ? "page" : undefined}
        onClick={mobile ? () => setOpen(false) : undefined}
        className={
          mobile
            ? "block rounded-lg px-4 py-4 text-base font-medium hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:text-primary"
            : "py-3 hover:text-primary aria-[current=page]:text-primary"
        }
      >
        {label}
      </Link>
    ));
  return (
    <>
      <div className="hidden items-center gap-6 text-sm font-medium text-brand-navy lg:flex">
        {links(false)}
      </div>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Open navigation"
              />
            }
          >
            <Menu aria-hidden="true" className="size-5" />
          </SheetTrigger>
          <SheetContent className="w-[min(100vw,360px)] overflow-y-auto bg-background motion-reduce:animate-none">
            <SheetHeader className="pr-16">
              <SheetTitle>Explore TaskWavePH</SheetTitle>
              <SheetDescription>
                Explore our services, partnership process, and careers.
              </SheetDescription>
            </SheetHeader>
            <nav
              aria-label="Mobile navigation"
              className="px-4 text-brand-navy"
            >
              {links(true)}
              <div className="mt-6 border-t pt-6 pb-6">
                <Link
                  href={ctaHref}
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ className: "min-h-12 w-full" })}
                >
                  {audience === "applicant" ? "Apply Now" : "Work With Us"}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
