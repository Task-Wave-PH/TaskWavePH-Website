import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BusinessLink({
  href,
  compact = false,
  light = false,
}: {
  href: string;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "lg" }),
        "min-h-12 h-auto whitespace-normal gap-2 px-6 py-3 text-sm font-semibold motion-reduce:transition-none",
        compact && "min-h-11 px-3 text-xs sm:px-5 sm:text-sm",
        light && "bg-white text-brand-navy hover:bg-secondary",
      )}
    >
      {compact ? "Work With Us" : "Discuss Your Business Needs"}
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
}
