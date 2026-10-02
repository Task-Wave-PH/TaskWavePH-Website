import Link from "next/link";
import { PolicyPage } from "@/components/layout/policy-page";
import {
  getTrackedHref,
  type TrackingQuery,
} from "@/features/applications/tracking";
import { getPrivacyInformation } from "@/lib/privacy";
import { pageMetadata } from "@/lib/page-metadata";
import { RECEIPT_MAX_AGE } from "@/features/submissions/receipt";
import { COOKIE_NOTICE_MAX_AGE } from "@/lib/cookie-notice";

export const metadata = pageMetadata(
  "Privacy Policy",
  "How TaskWavePH handles recruitment information, business enquiries, cookies, and your privacy choices.",
  "/privacy",
);
const sections = [
  { id: "overview", title: "Who this policy covers" },
  { id: "information", title: "Information we collect" },
  { id: "purposes", title: "How information is used" },
  { id: "sharing", title: "Access and service providers" },
  { id: "retention", title: "Storage and retention" },
  { id: "choices", title: "Your choices and requests" },
  { id: "cookies", title: "Cookies and security" },
  { id: "contact", title: "Contact and policy updates" },
] as const;

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  const information = getPrivacyInformation();
  return (
    <PolicyPage
      query={query}
      title="Privacy Policy"
      description="Understand what you share with us, why we ask for it, and how we handle it."
      status={information.status}
      sections={sections}
    >
      <section id="overview">
        <h2>Who this policy covers</h2>
        <p>
          This policy describes how {information.organization} handles
          information from website visitors, people applying for opportunities,
          and businesses exploring collaboration with TaskWavePH.
        </p>
        <p className="rounded-xl border bg-secondary/60 p-4 text-sm">
          {information.notice}
        </p>
      </section>
      <section id="information">
        <h2>Information we collect</h2>
        <h3 className="mt-5">Recruitment applications</h3>
        <p>
          We request your name, email address, mobile number, city or location,
          and position of interest. You may also provide experience, employment
          status, availability, salary expectations and optional salary history,
          key strengths, approximate commute details, relocation preferences,
          portfolio links, a message, and an optional resume PDF or resume link.
          Uploaded resumes are optional, PDF only, and limited to 2 MB.
        </p>
        <h3 className="mt-5">Business enquiries</h3>
        <p>
          We request your company name, contact name, email address, service
          interests, and a description of your business needs. Phone number and
          company website are optional.
        </p>
        <h3 className="mt-5">Submission and website information</h3>
        <p>
          We record when information is submitted, the form’s consent version,
          and approved campaign or source information supplied in the link you
          used. We use security checks and limited technical signals to protect
          submissions from abuse.
        </p>
        <p>
          Please provide only information relevant to your application or
          enquiry. Avoid sending government identification numbers, financial
          account details, health records, or other sensitive information that
          we have not requested.
        </p>
      </section>
      <section id="purposes">
        <h2>How information is used</h2>
        <ul>
          <li>
            Review applications and assess suitability for available
            opportunities.
          </li>
          <li>Contact applicants when their profile matches an opportunity.</li>
          <li>Understand business support needs and respond to enquiries.</li>
          <li>
            Maintain internal review records and protect the website from
            repeated or abusive submissions.
          </li>
        </ul>
        <p>
          Recruitment and enquiry forms ask for your agreement before
          submission. Providing information does not guarantee employment,
          contact, or a business partnership. We have not installed analytics or
          advertising tools on this website.
        </p>
      </section>
      <section id="sharing">
        <h2>Access and service providers</h2>
        <p>
          Application and enquiry records are available to approved TaskWavePH
          staff for the purposes described above. Signing in alone does not
          grant access to those records.
        </p>
        <p>
          Convex provides record and resume storage. Clerk provides staff
          authentication when enabled. Cloudflare Turnstile provides
          form-security checks, and Vercel provides website hosting. These
          providers may process technical information needed to deliver their
          services. Infrastructure may process information outside the
          Philippines.
        </p>
        <p>
          Uploaded resume files do not have public download links. Staff access
          to viewing and downloads is checked separately. For information about
          Turnstile’s processing, see{" "}
          <a
            href="https://www.cloudflare.com/turnstile-privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cloudflare’s Turnstile Privacy Notice
          </a>
          .
        </p>
      </section>
      <section id="retention">
        <h2>Storage and retention</h2>
        <p>
          {information.retention ??
            "TaskWavePH is finalizing its retention periods before collecting real applicant and business enquiry information. No fixed retention period is represented by this development draft."}
        </p>
        <p>
          Approved staff can delete records and their attached resumes.
          Temporary resume uploads that are not linked to a saved application
          are scheduled for removal after one hour.
        </p>
        <p>
          We use access controls and validation to protect information. Keep the
          information you share relevant to your application or enquiry.
        </p>
      </section>
      <section id="choices">
        <h2>Your choices and requests</h2>
        <p>
          You may contact the responsible organization to ask about your
          information, request access or correction, seek deletion where
          applicable, or withdraw consent. Requests may require verification so
          information is not disclosed to someone else. Your rights and how a
          request can be fulfilled depend on applicable law and the processing
          involved.
        </p>
        <p>
          Optional fields and resume uploads can be left blank. Choosing not to
          provide required information means the corresponding application or
          enquiry cannot be processed.
        </p>
        <p>
          Cookie-notice acknowledgment is separate from recruitment or
          business-enquiry consent. Clicking “Got it” does not submit a form or
          agree to recruitment processing.
        </p>
      </section>
      <section id="cookies">
        <h2>Cookies and security</h2>
        <p>
          Cookies are small browser records used for necessary website functions
          or to remember a preference. The website does not currently include
          analytics or advertising integrations.
        </p>
        <div
          role="region"
          aria-label="Cookie information table"
          tabIndex={0}
          className="mt-5 overflow-x-auto rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">
              Website cookies and browser storage
            </caption>
            <thead className="bg-secondary text-brand-navy">
              <tr>
                <th scope="col" className="p-4 font-semibold">
                  Cookie or service
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Purpose
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Submission receipts
                </th>
                <td className="p-4">
                  Allow the matching confirmation page after a verified save;
                  contain no applicant details or record IDs.
                </td>
                <td className="p-4">{RECEIPT_MAX_AGE / 60} minutes</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Notice acknowledgment
                </th>
                <td className="p-4">
                  Remember the notice version you acknowledged.
                </td>
                <td className="p-4">{COOKIE_NOTICE_MAX_AGE / 86400} days</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Staff authentication
                </th>
                <td className="p-4">
                  Keep approved staff signed in when Clerk is configured.
                </td>
                <td className="p-4">Provider/session dependent</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Form-security services
                </th>
                <td className="p-4">
                  Turnstile checks protect submissions. Clearance cookies depend
                  on the widget and Cloudflare configuration.
                </td>
                <td className="p-4">Configuration dependent</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Use your browser settings to remove or block cookies. Blocking
          essential cookies may prevent staff sign-in or submission confirmation
          pages from working. Removing the notice preference can make the notice
          appear again. Use “Cookie information” in the footer to reopen the
          explanation.
        </p>
      </section>
      <section id="contact">
        <h2>Contact and policy updates</h2>
        {information.contact ? (
          <>
            <p>
              For privacy requests, contact {information.organization} at{" "}
              <a href={`mailto:${information.contact}`}>
                {information.contact}
              </a>
              .
            </p>
            <p>
              Please describe your request and the application or enquiry it
              relates to without sending unnecessary sensitive information.
            </p>
          </>
        ) : (
          <p>
            TaskWavePH is finalizing its published privacy contact and
            request-handling details before real-data collection opens. Do not
            send real personal information through this development site.
          </p>
        )}
        <p>
          We may update this policy when website functions or processing
          practices change. The date at the top identifies the latest version.
          See our{" "}
          <Link href={getTrackedHref("/terms", query)}>Website Terms</Link> for
          information about using this website.
        </p>
      </section>
    </PolicyPage>
  );
}
