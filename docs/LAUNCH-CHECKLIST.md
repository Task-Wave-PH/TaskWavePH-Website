# Launch acceptance and weekly operations

## Readiness as of October 2, 2026

The public website is available. Read-only checks confirmed HTTP 200 for Home,
Apply, Business Enquiry, Careers, Privacy, Terms, sitemap and robots. Application
submission is enabled, and both forms include Turnstile. Public `/admin` and
`/dev-preview` return 404 with noindex; direct confirmation routes redirect to
the matching form. These observations do not verify a successful write or staff
permissions. Local checks are not a production sign-off.

Record the actual result, date, and tester for each item below. Do not record
passwords, tokens, verification codes, applicant information, or secrets here.
Use the confirmed production services from [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md).

## Production acceptance — owner performed

| Check                | Expected result                                                                                                                      | Result / date / tester                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Login layout         | Email/password focus rings and new-device instructions fit at 360px and desktop; verification instructions remain visible            | Pending                                             |
| Owner login          | Owner reaches dashboard and Users; logout returns to sign-in                                                                         | Pending                                             |
| Staff invitation     | Invite a second email you control; accept, then sign in as Staff                                                                     | Pending                                             |
| Staff authorization  | Staff can manage applicants, leads, jobs; direct Users navigation and backend staff-management calls are denied                      | Pending                                             |
| Revocation           | Deactivated Staff loses record access; final active Owner cannot be deactivated or demoted                                           | Pending                                             |
| Test job             | Draft is private; Published appears on Careers; apply link resolves that job                                                         | Pending                                             |
| Application save     | Submit synthetic details and an optional non-sensitive PDF (up to 2 MB); success appears after the record is saved                   | Pending                                             |
| Applicant management | Correct job association, read-only profile, status/notes updates, protected PDF view/download, CSV/XLSX export work                  | Pending                                             |
| Business enquiry     | Synthetic enquiry confirms after save; lead appears and status/priority/notes updates work                                           | Pending                                             |
| Retry/failure        | On development, failed writes show no success; identical uncertain retries save once; disabled/cooldown states preserve entries      | Pending                                             |
| Direct confirmation  | Without a matching receipt, both success URLs redirect to their forms                                                                | Read-only check passed, Oct 2, 2026                 |
| Host isolation       | Public/preview hosts block private routes/APIs and admin is noindex/private                                                          | Public route subset checked; complete check pending |
| QR / mobile          | Actual QR scan preserves source/campaign through application and saved tracking metadata                                             | Pending                                             |
| Privacy / services   | Approved contact/organization/retention, separate production services, real Turnstile keys and disabled production seeding confirmed | Pending owner review                                |
| Recovery             | Full snapshot including resumes secured; restore rehearsal in an isolated deployment succeeds                                        | Pending                                             |
| Hosting eligibility  | Hosting terms permit the business website                                                                                            | Pending owner decision                              |

Use clearly labeled test records and email accounts you control. Do not use real
applicant information. Do not send invitations to third parties. Close the test
job after testing; permanently deleting jobs with linked applications is blocked.
Delete only the identified synthetic submissions and verify their attached files
are removed. Production tests require explicit owner authorization; automated CI
never creates production records or invitations.

A missing invitation acceptance, production save, or role test remains Pending.
Do not label it Passed based on a mocked or preview session. If submission checks
fail, disable collection until resolved. Keep a verified read-only public website
available while investigating.

## Weekly operations

- Owner/recruitment lead: verify public pages and signed-out admin routing; review
  failed submissions and provider error logs without copying personal data.
- Owner: review Convex storage, bandwidth, I/O and function usage; Clerk user/email
  usage; Vercel functions, image transformations and analytics quotas. Check the
  account dashboards and provider warnings, not assumptions based on low traffic.
- Owner: take and verify a full snapshot following [RECOVERY.md](RECOVERY.md),
  before significant backend changes as well as weekly. Record date, deployment,
  commit, archive location and restore-test result without secrets.
- Owner: review staff approvals/invitations and published jobs. Confirm real
  enquiries and applications are being processed.
- Developer: inspect dependency advisories and failed Quality checks, fix confirmed
  issues, and preserve an identified last-known-good deployment.

Vercel Hobby is restricted to personal, non-commercial use. A working domain or
personal account does not establish eligibility for business hosting. Resolve
hosting eligibility before business launch; do not change hosting or purchase a
plan automatically. [Vercel Hobby terms](https://vercel.com/docs/plans/hobby)

## Repository quality gate

`Quality / Quality gate` runs lint, typecheck, formatting, unit/backend tests, a
production build and Chromium browser tests on pull requests and main pushes.
It uses no provider secrets. In GitHub branch rules, the owner can require this
check and PR review before merging; adding the workflow alone does not enforce
branch protection. Provider preview checks are separate from this quality gate.
