import { submissionsEnabled } from "@/lib/submission-env";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import { steps } from "@/lib/brand-content";

export const metadata = pageMetadata(
  "How It Works",
  "Learn how to prepare for a TaskWavePH application, including contact details, an optional resume link, and privacy consent.",
  "/how-it-works",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <ContentPage
      query={query}
      eyebrow={"Your next step"}
      title={"Your next step, made simple."}
      description={
        submissionsEnabled()
          ? "A little preparation makes it easier to share your story."
          : "A little preparation makes it easier to share your story when applications open."
      }
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li key={title}>
            <Card className="h-full">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-primary">
                    0{index + 1}
                  </span>
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">
                  {submissionsEnabled() && title === "Apply when we open"
                    ? "Submit your application"
                    : title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {submissionsEnabled()
                    ? description.replace("Once applications open, ", "")
                    : description}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <section className="max-w-3xl">
        <h2 className="text-2xl font-semibold">Before you apply</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Prepare your contact information, location, position interests,
          experience, and availability. A resume link is optional. You will need
          to read the privacy notice and agree to recruitment-related processing
          before a future submission.
        </p>
        <Link
          href={getTrackedHref("/privacy", query)}
          className={buttonVariants({
            variant: "link",
            className: "mt-3 min-h-11 px-0",
          })}
        >
          Read the privacy notice
        </Link>
        <h2 className="mt-8 text-2xl font-semibold">What happens next?</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {submissionsEnabled()
            ? "Our recruitment team will review your information and contact you if your profile matches an available opportunity."
            : "Once applications open, our recruitment team will review your information and contact you if your profile matches an available opportunity."}
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {submissionsEnabled()
            ? "You will see a confirmation only after your application is saved successfully."
            : "For now, the form checks your entries locally. It does not send or save your information, and completing the preview is not a submitted application."}
        </p>
      </section>
    </ContentPage>
  );
}
