# Applicant screening reference

Reviewed October 2, 2026: owner-supplied **OneMiners PH hiring process_2026.pdf**
(two pages, local Downloads file). The owner approved using it as a reference
while preserving each TaskWavePH job's work arrangement.

## Implemented

- Keep existing applicant contact, role, consent, optional PDF, and tracking fields.
- Clarify availability as possible start date / availability and experience as
  years of active work experience.
- Add optional expected salary, previous salary, two key strengths, approximate
  distance/travel time from Dagupan, relocation preference, and portfolio link.
  Salary is bounded plain text so currency, pay period, and negotiable answers
  can be expressed. No exact home address is requested.
- Store new values through the existing validated submission service and Convex
  adapter. Schema additions are optional so historical records remain valid.
  Blank new fields serialize as absent values to preserve the existing submission
  fingerprint for unchanged retries across the rollout.
- Display screening values in private applicant details and append them to
  CSV/XLSX exports, preserving existing column positions.
- Staff can copy a missing-information request, review it, and send it using
  their existing communication process. This button sends no email.
- Checklist guidance covers start date, expected salary, experience, strengths,
  and an attached PDF. It is not an eligibility decision. A resume link alone
  does not satisfy the PDF follow-up check; submission still permits links.
- Existing status/notes actions and Owner-only user management remain in place.

## Not adopted as TaskWavePH policy

The source describes OneMiners email/contacts, office address, on-site rules,
interview times, photo CV requirements, school contacts, intern slots, allowances,
and training documents. These are not verified TaskWavePH commitments. Do not
publish them, require photos, automatically reject remote applicants, or promise
interviews, hiring, or internships based on this reference.

Interview scheduling, messaging integrations, new pipeline statuses, and intern
management are outside this change. Staff assess work arrangement and relocation
against the actual posting. Existing statuses remain New, Reviewed, Shortlisted,
and Closed. Incomplete screening information does not block submission or saving
a review. Public privacy copy lists the new optional information collected.

Deploy the backend schema/functions to the intended development target before
testing new-field submissions against that target. Local checks do not deploy
or prove live storage/authentication. Use separate production services and review
privacy configuration before enabling production collection.
