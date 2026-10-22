import { notFound } from "next/navigation";
import { ApplicationPage } from "@/components/application/application-page";
import { getPublishedJob } from "@/features/jobs/server";
import type { TrackingQuery } from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<TrackingQuery>;
};
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { job } = await getPublishedJob(slug);
  return {
    ...pageMetadata(
      job ? `Apply for ${job.title}` : "Role unavailable",
      "Submit an application for a TaskWavePH opportunity.",
      `/apply/${job?.slug ?? slug}`,
    ),
    robots: { index: false, follow: false },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const result = await getPublishedJob(slug);
  if (result.state === "ready" && (!result.job || result.job.slug !== slug))
    notFound();
  return (
    <ApplicationPage
      query={await searchParams}
      identifier={slug}
      pathname={`/apply/${slug}`}
    />
  );
}
