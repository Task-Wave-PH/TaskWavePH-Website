import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <>
      <Header query={query} audience="applicant" />
      <main
        id="main-content"
        className="mx-auto w-full max-w-2xl px-5 py-20 sm:px-8"
      >
        <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Application received.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Thank you for your interest in TaskWavePH. Our recruitment team will
          review your information and contact you if your profile matches an
          available opportunity.
        </p>
        <Link
          href={getTrackedHref("/", query)}
          className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground"
        >
          Back to home
        </Link>
      </main>
      <Footer query={query} />
    </>
  );
}
