import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/env";

export default function NotFound() {
  return (
    <StatusPage
      kind="not-found"
      title="This page isn’t available."
      description="The workspace link may be incorrect, or the page may no longer exist. Return to the dashboard to continue."
      homeHref={getSiteUrl()}
    >
      <Link
        href="/admin"
        className={buttonVariants({
          className: "min-h-11 w-full gap-2 px-5 sm:w-fit",
        })}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to dashboard
      </Link>
    </StatusPage>
  );
}
