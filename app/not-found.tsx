import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/env";

export default function NotFound() {
  const home = getSiteUrl();
  return (
    <StatusPage
      kind="not-found"
      title="Let’s get you back on track."
      description="The page you’re looking for may have moved, or the link may be incorrect. Explore TaskWavePH from our homepage."
      homeHref={home}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={home}
          className={buttonVariants({ className: "min-h-11 gap-2 px-5" })}
        >
          Back to home
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <Link
          href={`${home.replace(/\/$/, "")}/areas-of-work`}
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11 px-5",
          })}
        >
          Explore services
        </Link>
      </div>
    </StatusPage>
  );
}
