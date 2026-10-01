import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ApplyLink({
  href,
  light = false,
  compact = false,
}: {
  href: string;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-13 gap-3 px-6 text-sm font-semibold motion-reduce:transition-none",
        compact && "h-11 gap-1.5 px-3.5 text-xs sm:px-5 sm:text-sm",
        light && "bg-white text-brand-navy hover:bg-secondary",
      )}
    >
      Apply Now <ArrowUpRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
