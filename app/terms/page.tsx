import Link from "next/link";
import { PolicyPage } from "@/components/layout/policy-page";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
export const metadata = pageMetadata(
  "Website Terms",
  "Terms for using the TaskWavePH website, submitting applications, and making business enquiries.",
  "/terms",
);
const sections = [
  { id: "website", title: "About these terms" },
  { id: "use", title: "Responsible website use" },
  { id: "content", title: "Brand and website content" },
  { id: "applications", title: "Recruitment applications" },
  { id: "enquiries", title: "Business enquiries" },
  { id: "providers", title: "Links and service availability" },
  { id: "privacy", title: "Privacy and changes" },
] as const;
export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <PolicyPage
      query={query}
      title="Website Terms"
      description="A clear starting point for using our website and sharing an application or business enquiry."
      status="Development draft"
      sections={sections}
    >
      <section id="website">
        <h2>About these terms</h2>
        <p>
          These terms describe the intended use of the TaskWavePH public
          website. The site introduces our outsourcing and business support
          services and provides recruitment and business-enquiry forms when
          submissions are enabled.
        </p>
        <p className="rounded-xl border bg-secondary/60 p-4 text-sm">
          These website terms are a development draft for review before launch.
          Development forms should receive test information only.
        </p>
      </section>
      <section id="use">
        <h2>Responsible website use</h2>
        <p>
          Use the website for genuine service enquiries, recruitment
          applications, and learning about TaskWavePH.
        </p>
        <ul>
          <li>
            Provide information that is accurate to the best of your knowledge.
          </li>
          <li>Submit only information and files you are entitled to share.</li>
          <li>
            Do not impersonate another person, submit abusive content, upload
            malicious files, or attempt to gain access to private records.
          </li>
          <li>
            Do not interfere with the website, bypass security checks, or send
            automated spam.
          </li>
        </ul>
      </section>
      <section id="content">
        <h2>Brand and website content</h2>
        <p>
          TaskWavePH’s name, logos, artwork, and website content are provided to
          explain our services and opportunities. Their appearance on the
          website does not grant permission to use them in a way that implies
          endorsement or affiliation.
        </p>
        <p>
          Some website illustrations are AI-generated conceptual artwork. They
          do not depict verified TaskWavePH staff, clients, or facilities.
          Service categories and examples describe areas of support; they are
          not promises of specific outcomes or verified vacancies.
        </p>
      </section>
      <section id="applications">
        <h2>Recruitment applications</h2>
        <p>
          Only published job postings identify open roles on Careers. General
          applications allow you to share your profile for recruitment review.
          Submission does not guarantee an interview, employment, or a response.
          Our team may contact you if your profile matches an available
          opportunity.
        </p>
        <p>
          Optional resumes must be PDFs no larger than 2 MB. A confirmation page
          means the submission was saved, not that you have been shortlisted or
          hired. If submission fails, follow the form’s instructions and try
          again.
        </p>
      </section>
      <section id="enquiries">
        <h2>Business enquiries</h2>
        <p>
          A business enquiry starts a conversation about your company’s needs.
          It does not create a service agreement, reserve staff, establish
          pricing, or guarantee availability.
        </p>
        <p>
          Service scope, responsibilities, working arrangements, commercial
          terms, and any commitments need to be discussed and agreed separately
          before collaboration begins.
        </p>
      </section>
      <section id="providers">
        <h2>Links and service availability</h2>
        <p>
          External links and service providers may have their own terms and
          privacy notices. Review those notices when using third-party services
          or sharing information through an external resume link.
        </p>
        <p>
          Website functions may be interrupted for maintenance or technical
          reasons. Content and available opportunities may change. Review the
          current role details before applying and use the latest service
          information when making an enquiry.
        </p>
      </section>
      <section id="privacy">
        <h2>Privacy and changes</h2>
        <p>
          Our{" "}
          <Link href={getTrackedHref("/privacy", query)}>Privacy Policy</Link>{" "}
          explains the information requested by forms, cookies, and privacy
          choices. Reading website terms or acknowledging the cookie notice does
          not replace the separate consent required by submission forms.
        </p>
        <p>
          We may update these terms as the website develops. The version date
          appears at the top of this page. Confirmed employment or service
          agreements are handled separately from these website-use terms.
        </p>
      </section>
    </PolicyPage>
  );
}
