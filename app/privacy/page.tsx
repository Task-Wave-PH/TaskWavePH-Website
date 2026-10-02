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
          We keep a record of your submission date and consent. We may also
          record which campaign or referral link brought you to the website.
          Limited browser and connection information is used to help prevent
          spam, fraud, and misuse.
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
          contact, or a business partnership. This website does not currently
          use advertising or analytics tracking tools.
        </p>
      </section>
      <section id="sharing">
        <h2>Access and service providers</h2>
        <p>
          Access to application and enquiry information is limited to authorized
          TaskWavePH personnel who review recruitment applications, respond to
          business enquiries, or administer these services.
        </p>
        <p>
          We use service providers to host this website, store submitted
          information, support authorized staff access, and protect forms from
          abuse. These providers may process personal and technical information
          needed to provide their services. Information may be stored or
          processed outside the Philippines.
        </p>
        <p>
          Uploaded resumes are not publicly available. Only authorized staff may
          view or download them for recruitment review. Contact us using the
          details below if you have questions about our use of service
          providers.
        </p>
      </section>
      <section id="retention">
        <h2>Storage and retention</h2>
        <p>
          {information.retention ??
            "Our data retention notice is being finalized. Applications and business enquiries are not open for personal information collection until this notice is approved."}
        </p>
        <p>
          Records and attached resumes may be deleted in accordance with our
          retention notice and applicable requests. Incomplete resume uploads
          are scheduled for removal after one hour.
        </p>
        <p>
          We use access restrictions and security checks to help protect your
          information. No online service can guarantee complete security. Keep
          the information you share relevant to your application or enquiry.
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
                  Display confirmation after a successful submission, without
                  storing your application details in the cookie.
                </td>
                <td className="p-4">{RECEIPT_MAX_AGE / 60} minutes</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Notice acknowledgment
                </th>
                <td className="p-4">
                  Remember that you acknowledged the current cookie notice.
                </td>
                <td className="p-4">{COOKIE_NOTICE_MAX_AGE / 86400} days</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Staff sign-in
                </th>
                <td className="p-4">
                  Keep authorized staff signed in to the private workspace.
                </td>
                <td className="p-4">Depends on the sign-in session</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Form protection
                </th>
                <td className="p-4">
                  Help distinguish genuine visitors from automated abuse.
                  Security services may use cookies depending on their settings.
                </td>
                <td className="p-4">Depends on the security service</td>
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
            request-handling details. Please do not submit personal information
            until our collection notice is finalized.
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
