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

export const metadata = pageMetadata(
  "Careers",
  "Explore TaskWavePH careers, prepare your details, and learn what to expect when applying.",
  "/careers",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <ContentPage
      audience="applicant"
      query={query}
      eyebrow={"Careers"}
      title={"Make room for your next move."}
      description={
        submissionsEnabled()
          ? "Explore our areas of work and submit a general application. There are no confirmed vacancies listed here."
          : "Explore our areas of work and prepare for a future application. Applications are opening soon; there are no confirmed vacancies listed here."
      }
    >
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Start with your interests.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Our work spans customer support, digital marketing, web development,
            virtual assistance, administration, and sales support. Explore the
            areas where your experience and interests could contribute.
          </p>
          <Link
            href={getTrackedHref("/areas-of-work", query)}
            className={buttonVariants({
              variant: "link",
              className: "mt-4 min-h-11 px-0",
            })}
          >
            Explore areas of work
          </Link>
        </div>
        <Card className="bg-secondary ring-0">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">
              Your preparation checklist
            </h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 leading-relaxed text-muted-foreground">
              <li>Current email address and mobile number</li>
              <li>City or location and position interests</li>
              <li>Experience, employment status, and availability</li>
              <li>An optional PDF resume (up to 2 MB) or resume link</li>
              <li>Review the privacy notice before giving consent</li>
            </ul>
          </CardContent>
        </Card>
      </section>
      <section className="max-w-3xl">
        <h2 className="text-2xl font-semibold">How to apply</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-muted-foreground">
          <li>
            Explore our services and identify where your skills could
            contribute.
          </li>
          <li>
            Prepare your contact details, experience, availability, and optional
            resume.
          </li>
          <li>
            Complete the application and privacy consent when submissions are
            enabled. A confirmation appears only after your information is
            saved.
          </li>
        </ol>
        <h2 className="text-2xl font-semibold">Know what to expect.</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {submissionsEnabled()
            ? "Submit your information for recruitment review. Applying does not reserve a role or guarantee contact. Our team will contact you if your profile matches an available opportunity."
            : "The application preview lets you check your entries without sending or saving personal information. It does not reserve a role or register an application. When applications open, contact will depend on matching an available opportunity."}
        </p>
        <Link
          href={getTrackedHref("/privacy", query)}
          className={buttonVariants({
            variant: "link",
            className: "mt-4 min-h-11 px-0",
          })}
        >
          Read the privacy notice
        </Link>
      </section>
    </ContentPage>
  );
}
