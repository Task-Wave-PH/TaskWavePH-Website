import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How TaskWavePH intends to use applicant information for recruitment.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl space-y-8 px-5 py-12 sm:px-8"
      >
        <div>
          <p className="text-sm font-semibold text-primary">YOUR INFORMATION</p>
          <h1 className="mt-3 text-3xl font-semibold">Privacy notice</h1>
          <p className="mt-4 rounded-lg border bg-secondary p-4 text-sm leading-relaxed">
            Draft notice. Applications are not open yet. The current form
            validates entries locally and does not transmit or save them.
          </p>
        </div>
        <section>
          <h2 className="text-xl font-semibold">Information requested</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The planned application process asks for your name, email, mobile
            number, location, role interests, experience, employment status,
            availability, and optional resume link and notes. Campaign and
            source information may accompany your application.
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
          <h2 className="text-xl font-semibold">Before applications open</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            TaskWavePH will finalize this notice, including the responsible
            organization’s details, privacy contact, retention period, and the
            process for requesting access, corrections, or withdrawal of
            consent, before collecting real applications.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
