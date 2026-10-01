import { submissionsEnabled } from "@/lib/submission-env";
import Image from "next/image";
import { isLocalPreview } from "@/lib/dev-preview";
import { PreviewCareers } from "@/components/jobs/job-preview";
import { JobList } from "@/components/jobs/job-list";
import { publicJobsClient } from "@/features/jobs/server";
import { api } from "@/convex/_generated/api";
import {
  serviceAreas,
  workArrangements,
  type JobView,
} from "@/features/jobs/schema";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getTrackedHref,
  getApplyHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";

const careersMetadata = pageMetadata(
  "Careers",
  "Explore TaskWavePH careers, prepare your details, and learn what to expect when applying.",
  "/careers",
);
export async function generateMetadata() {
  return {
    ...careersMetadata,
    ...((await isLocalPreview())
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const serviceArea = serviceAreas.find((s) => s === query.serviceArea);
  const arrangement = workArrangements.find((s) => s === query.arrangement);
  const cursor =
    typeof query.cursor === "string" && query.cursor.length < 4000
      ? query.cursor
      : null;
  let jobs: JobView[] = [];
  let nextHref: string | undefined;
  let unavailable = false;
  try {
    const client = publicJobsClient();
    if (!client) unavailable = true;
    else {
      const result = await client.query(api.jobs.published, {
        serviceArea,
        arrangement,
        paginationOpts: { numItems: 12, cursor },
      });
      jobs = result.page;
      if (!result.isDone) {
        const next = new URL(
          getTrackedHref("/careers", query),
          "https://taskwaveph.com",
        );
        if (serviceArea) next.searchParams.set("serviceArea", serviceArea);
        if (arrangement) next.searchParams.set("arrangement", arrangement);
        next.searchParams.set("cursor", result.continueCursor);
        nextHref = next.pathname + next.search;
      }
    }
  } catch {
    unavailable = true;
  }

  const sampleFallback =
    (await isLocalPreview()) &&
    jobs.length === 0 &&
    !serviceArea &&
    !arrangement &&
    !cursor;
  return (
    <ContentPage
      audience="applicant"
      query={query}
      eyebrow={"Careers"}
      title={"Make room for your next move."}
      description="Explore open roles, learn where your skills could contribute, and prepare your next step with TaskWavePH."
    >
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold">
            Philippine talent. Shared possibilities.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Discover opportunities to contribute to the customer support,
            digital, and business operations our clients rely on.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#open-roles"
              className={buttonVariants({ size: "lg", className: "min-h-12" })}
            >
              Explore Open Roles
            </Link>
            <Link
              href={getApplyHref(query)}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "min-h-12",
              })}
            >
              General Application
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-secondary p-6">
          <Image
            src="/images/services/admin-business-support.webp"
            alt=""
            width={1254}
            height={1254}
            sizes="(max-width: 767px) calc(100vw - 88px), 500px"
            className="h-auto w-full object-contain"
          />
        </div>
      </section>
      {sampleFallback ? (
        <PreviewCareers query={query} />
      ) : (
        <JobList
          key={`${serviceArea}-${arrangement}-${cursor}`}
          jobs={jobs}
          query={query}
          filters={{ serviceArea, arrangement }}
          nextHref={nextHref}
          unavailable={unavailable}
        />
      )}
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
        <h2 className="mt-8 text-2xl font-semibold">Know what to expect.</h2>
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
