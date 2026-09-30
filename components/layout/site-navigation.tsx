"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
  ["Areas of Work", "/areas-of-work"],
  ["How It Works", "/how-it-works"],
  ["Careers", "/careers"],
  ["About", "/about"],
] as const;

export function SiteNavigation({ query = {} }: { query?: TrackingQuery }) {
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
          <SheetContent className="w-[min(100vw,360px)] bg-background motion-reduce:animate-none">
            <SheetHeader className="pr-16">
              <SheetTitle>Explore TaskWavePH</SheetTitle>
              <SheetDescription>
                Learn about our work and your next step.
              </SheetDescription>
            </SheetHeader>
            <nav
              aria-label="Mobile navigation"
              className="px-4 text-brand-navy"
            >
              {links(true)}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
