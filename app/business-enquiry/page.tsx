import { ContentPage } from "@/components/layout/content-page";
import { BusinessForm } from "@/components/submissions/business-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTracking,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { submissionsEnabled } from "@/lib/submission-env";
import { pageMetadata } from "@/lib/page-metadata";
export const metadata = pageMetadata(
  "Business Enquiry",
  "Tell TaskWavePH about your business support needs.",
  "/business-enquiry",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const enabled = submissionsEnabled();
  return (
    <ContentPage
      showCta={false}
      query={query}
      eyebrow="Work with us"
      title="Let’s talk about your business."
      description="Tell us what you need, and which services interest you."
    >
      <p>
        {enabled
          ? "Send your enquiry for our team to review."
          : "Enquiries are not open yet. This preview checks your entries without sending or saving them."}
      </p>
      <Card className="max-w-3xl py-0">
        <CardContent className="p-6 sm:p-8">
          <BusinessForm
            tracking={getTracking(query, "/business-enquiry")}
            enabled={enabled}
          />
        </CardContent>
      </Card>
    </ContentPage>
  );
}
