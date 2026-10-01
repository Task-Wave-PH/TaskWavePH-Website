import { submissionsEnabled } from "@/lib/submission-env";
import type { TrackingQuery } from "@/features/applications/tracking";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How TaskWavePH intends to use applicant information for recruitment.",
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <>
      <Header query={query} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl space-y-8 px-5 py-12 sm:px-8"
      >
        <div>
          <p className="text-sm font-semibold text-primary">YOUR INFORMATION</p>
          <h1 className="mt-3 text-3xl font-semibold">Privacy notice</h1>
          <p className="mt-4 rounded-lg border bg-secondary p-4 text-sm leading-relaxed">
            {submissionsEnabled()
              ? process.env.NODE_ENV === "production"
                ? "This notice explains how TaskWavePH processes recruitment applications and business enquiries."
                : "Development collection notice. Use test information only until the production policy is finalized."
              : "Draft notice. Applications and enquiries are not open yet. Forms validate entries locally and do not transmit or save them."}
          </p>
        </div>
        <section>
          <h2 className="text-xl font-semibold">Information requested</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The planned application process asks for your name, email, mobile
            number, location, role interests, experience, employment status,
            availability, and optional resume PDF (up to 2 MB), resume link, and
            notes. Campaign and source information may accompany your
            application.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Recruitment purpose</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            When submissions are enabled, TaskWavePH intends to use this
            information to assess recruitment and employment opportunities and
            contact applicants whose profiles match available roles. Providing
            an application does not guarantee employment or contact.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Consent and access</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Consent will be required before an application can be submitted.
            Applicant information is intended for authorized recruitment
            personnel and necessary service providers. Please avoid including
            sensitive information that is not needed for recruitment.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Business enquiries</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Business enquiries collect company and contact information, service
            interests, and your message so TaskWavePH can assess and respond to
            your business support needs.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Storage and deletion</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            When enabled, records and resume PDFs are stored in Convex and
            accessed by approved staff. Clerk manages staff authentication, and
            Cloudflare Turnstile helps protect submissions from abuse. Staff can
            permanently delete records and attached resumes. Temporary
            unattached uploads are removed after one hour. A retention period
            and a privacy contact must be finalized before production
            collection.
          </p>
        </section>
        {process.env.PRIVACY_CONTACT_EMAIL && (
          <section>
            <h2 className="text-xl font-semibold">Privacy contact</h2>
            <p className="mt-3">
              {process.env.PRIVACY_ORGANIZATION || "TaskWavePH"}
            </p>
            <a
              className="text-primary underline"
              href={`mailto:${process.env.PRIVACY_CONTACT_EMAIL}`}
            >
              {process.env.PRIVACY_CONTACT_EMAIL}
            </a>
            <p className="mt-3">
              Contact us to request access, corrections, deletion, or withdrawal
              of consent.
            </p>
          </section>
        )}
        {!submissionsEnabled() && (
          <section>
            <h2 className="text-xl font-semibold">Before applications open</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              TaskWavePH will finalize this notice, including the responsible
              organization’s details, privacy contact, retention period, and the
              process for requesting access, corrections, or withdrawal of
              consent, before collecting real applications.
            </p>
          </section>
        )}
      </main>
      <Footer query={query} />
    </>
  );
}
