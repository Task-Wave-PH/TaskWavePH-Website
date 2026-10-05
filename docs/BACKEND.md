# Convex MVP setup

## Local security verification

PDF viewer troubleshooting: `InvalidPDFException` means the parser could not
read the received file as a document. Earlier smoke fixtures contained only a
PDF header and EOF marker; they pass signature checks but are not readable PDFs.
Smoke and live-submission tests now use the valid shared two-page sample.
Run the smoke script via `npm run convex:smoke` (Node 22 type stripping loads the
shared TypeScript sample). Already stored malformed files are not repaired by a
code update: replace confirmed synthetic records through the development workflow,
or obtain a new PDF from the applicant. Do not overwrite real CVs automatically.
The viewer keeps downloads available and disables pagination/zoom when loading fails.

See [SECURITY-AUDIT.md](SECURITY-AUDIT.md) for the October 2, 2026 local review,
adversarial tests, measured latency, cache/TTL checks, and remaining deployment
verification. This audit does not deploy backend changes or certify production.

Public submission endpoints reject foreign or opaque browser Origins and
`Sec-Fetch-Site: cross-site` before backend work. Same-origin browser requests and
non-browser requests without these headers still require all validation,
Turnstile, honeypot, and persistent throttling checks. Disabled collection remains 503. Rejected origins return the safe `INVALID_ORIGIN` code with 403 and no receipt.

Export backend fetches bypass caching, share a 25-second abort budget, and cancel
on caller disconnect. Workbook generation is bounded by the existing 5,000-row
limit; the network abort signal cannot preempt synchronous encoding work.
Direct Convex CV errors as well as successful downloads are private/no-store.
Pending uploads expire at the exact one-hour boundary. Cookie-bearing or explicitly
credentialed job queries never qualify for public first-page caching.

## What is implemented

### Referrals and campaign links

Applicants may optionally enter a **Referred by** name or code (up to 200
characters). Staff see it in applicant details and CSV/XLSX exports. Historical
applications show Not provided. It is self-reported, not a verified employee
identity, and is separate from campaign attribution.

For a LinkedIn post linking to Careers:

```text
https://www.taskwaveph.com/careers?source=linkedin&campaign=october-2026&utm_source=linkedin&utm_medium=social&utm_campaign=october-2026
```

For a printed QR code linking directly to Apply:

```text
https://www.taskwaveph.com/apply?source=job-fair-qr&campaign=october-2026&utm_source=job-fair&utm_medium=qr&utm_campaign=october-2026
```

Encode the entire URL when creating a QR code. Use consistent campaign names;
source identifies the placement, utm_source the channel, and utm_medium its
format (such as social or qr). Existing navigation carries the allowlisted
parameters through Careers, role details, and Apply. Staff can inspect them in
applicant details and exports. Do not put names, email addresses, phone numbers,
or referral names into campaign URLs. Referral input is not populated from URLs.

Deploy the additive optional Convex field before deploying the updated form.
Old applications require no backfill. Blank referrals are omitted, preserving
the serialized payload and fingerprint for unchanged historical retries.

Applications and business leads are stored in Convex. Optional PDF resumes are
stored in Convex file storage. Next.js validates form requests, verifies Turnstile,
and calls a secret-authenticated Convex HTTP action. The backend revalidates,
throttles, reserves the submission token, stores the file, and commits a record.
Repeated identical submissions return the same reference. Changed payloads must
use a new token. Failed requests never produce the success navigation.

Both confirmation pages require a server-signed HttpOnly receipt cookie issued
only after Convex confirms persistence (including successful idempotent retries).
Receipts last 10 minutes and allow refresh during that window. Missing, altered,
expired, or wrong-kind receipts redirect to the corresponding form. They contain
only submission kind, issuance/expiry timestamps, and a random nonce, with no
record identifiers or personal data. The existing `CONVEX_SERVER_SECRET` signs
receipts with a separate message prefix; rotating it invalidates outstanding
receipts. Cookies are host-only, scoped to the matching success path, SameSite=Lax,
and Secure in production. Confirmation responses are private/no-store and noindex.
Successful forms perform a full navigation so stale prefetched redirects cannot
hide a newly issued receipt. No new environment variables or database tables are
needed. This guards the confirmation UI; it grants no access to applicant records.

Staff use Clerk email/password authentication. Every administrative query,
mutation, and download also checks `adminUsers`. Approved staff can review records,
filter by status, edit notes/status, view and download PDF resumes, export applicants,
and permanently delete records.
The dashboard uses the brand palette and shadcn Sidebar/Select/Card primitives.

## Cookie notice and policy pages

Public footers provide Privacy Policy (`/privacy`), Website Terms (`/terms`), and a
reopenable cookie-information Sheet. The public notice stores only
`tw-cookie-notice=1` for 180 days, with Path=/, SameSite=Lax, and Secure on HTTPS.
It remembers acknowledgment rather than optional tracking consent. Public pages
use cookie-free visitor analytics; no advertising integration is installed. Bump the version when the notice changes;
older acknowledgments will display the updated notice. If storage is unavailable,
dismissal works for the current mounted notice and may not survive navigation/reload.
Admin and development-preview routes omit this public notice.

Cookie acknowledgment does not preselect form consent, enable submissions, bypass
Turnstile, or grant a confirmation receipt. Existing receipt cookies remain HttpOnly
and expire after 10 minutes. Turnstile clearance cookies depend on its deployment
configuration; do not claim a fixed cookie list/lifetime for third-party services.

The privacy page validates and renders existing organization/contact/retention
configuration. Production publication requires all three fields plus approved
policy status; development remains labeled as a draft even with those fields set.
The owner approved the current Website Terms for publication on October 2, 2026;
their page shows published status. This does not enable production collection or
replace the separate privacy configuration and approval. Guidance references:
[NPC privacy-notice guidance](https://privacy.gov.ph/wp-content/uploads/2023/05/compendium_2018_1519.pdf),
[Cloudflare clearance documentation](https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/),
and [Turnstile’s privacy notice](https://www.cloudflare.com/turnstile-privacy-policy/).

## Development environment

1. Copy `.env.example` to `.env.local` if the file does not already exist. Never
   replace an existing environment file containing your keys.
2. Run `npm run convex:dev`. An existing Convex development project can be linked,
   or an anonymous local backend can be started using
   `CONVEX_AGENT_MODE=anonymous npx convex dev`. Keep it running during local tests.
3. Set `CONVEX_SERVER_SECRET` to a randomly generated 32+ character secret. Never
   use a deploy key for this purpose. Run `npm run convex:configure` to copy the
   server secret and Clerk issuer into the development backend without printing
   values. Local state and environment files are ignored by Git.
4. Create a Clerk development application. Enable email/password and password
   recovery; use restricted sign-up or provision users through the Clerk dashboard.
   Staff sign-up is invitation-only at `/admin/sign-up` (or `/sign-up` on the admin
   hostname). Set Clerk Restrictions → Sign-up mode to Invite-only / Restricted.
   Login has no signup link; registration without a ticket shows invitation guidance.
   Set the publishable key, secret key, and
   issuer domain in `.env.local`. Enable the Clerk Convex integration/JWT template
   with audience `convex`, then rerun `npm run convex:configure` and
   `npm run convex:check`. Never grant staff access from user-editable metadata.
5. Provision a staff account using its Clerk user ID, not its email:

   ```bash
   npx convex run provision:setStaff '{"subject":"user_REPLACE_ME","active":true}'
   ```

   Invoke from your authenticated CLI/development backend. To revoke access, run
   the same command with `active:false`. No staff-management public API exists.

6. Set Turnstile keys. The included localhost development placeholders in
   `.env.local` are Cloudflare test keys. Test keys are prohibited in production.
   The browser widget uses action `submission`. Real keys must match the public
   site hostname and the server checks action and hostname.
   Enabled submissions require both the browser site key and server secret.
   Production rejects all documented dummy site and secret keys, including
   failure and duplicate-token test keys. The localhost action/hostname exception
   applies only to Cloudflare's exact always-pass secret key.
7. Set `SUBMISSIONS_ENABLED=development` for dev-server-only submissions
   (disabled automatically in production builds). Start `npm run dev`.
   Submit synthetic data through `/apply` and `/business-enquiry`; review records
   and resume downloads at `/admin`. Do not test with real applicant information.
8. Run `npm run convex:smoke` to create a synthetic application with PDF and a
   business lead, check idempotent retry, and verify unauthorized download denial.
   Delete these synthetic records after reviewing. The script rejects `prod:`
   deployments. Development and production must never share data.

If Clerk is not configured, `/admin` displays setup-required messaging and exposes
no records. A local fail-closed issuer placeholder may be used to compile the
backend before Clerk exists; replace it with the real Clerk issuer before testing
login. It does not provide working authentication.

## Owners, staff, and invitations

Clerk authenticates users; Convex `adminUsers` remains the permission source.
Missing roles on older records mean Staff. Only active Owners see Users navigation
and can list staff/invitations or change access. Staff retain applicant, lead, and
job access. Every backend operation checks permission; host routing is additional
isolation, not authorization. Changes reject stale revisions, and transactions
prevent removing the last active Owner, including trusted CLI provisioning.

Bootstrap the first Owner using trusted access to the intended deployment:

```bash
npx convex run provision:setStaff '{"subject":"user_REPLACE_ME","active":true,"role":"Owner","email":"owner@example.com"}'
```

Use the matching Clerk user ID and verified email. Configure production independently;
development approvals never migrate automatically. For existing registered accounts
without an invitation, use trusted provisioning; do not create a second account.

Configure these **in Convex**, in addition to the existing issuer and shared secret:

- `CLERK_SECRET_KEY`: the matching Clerk instance's server key, never a public key.
- `STAFF_INVITATION_REDIRECT_URL`: `http://localhost:3000/admin/sign-up` in local
  development; `https://admin.taskwaveph.com/sign-up` in production.

`npm run convex:configure` copies these to development without printing keys and
derives the invitation URL from `NEXT_PUBLIC_ADMIN_URL` when no override is supplied.
Set Clerk signup mode to **Invite-only / Restricted** for the same instance.

Owners send seven-day email invitations with Owner/Staff roles. Convex stores the
role and eligibility; Clerk metadata contains only a reference, not authority.
Registration requires an invitation ticket and redirects to `/admin/accept-invitation`.
The authenticated acceptance action fetches the user from Clerk's Backend API,
checks the verified primary email and server-managed invitation reference, and
activates once only if the local invitation is pending/unexpired and its sponsoring
Owner remains active. Repeated acceptance is safe; old links cannot reactivate
disabled staff. Browser-supplied or user-editable metadata never grants access.

Owner invite attempts and authenticated acceptance attempts are limited to 20 per
hour per identity. Failed/uncertain sends retain the operation token; retry scans
bounded pending Clerk invitations for the reference before creating another.
Clerk also rejects duplicate addresses. Cancellation removes local eligibility
before remote revocation; retry cancellation if Clerk is unavailable. An expired
invitation requires cancellation and a new invite. Deactivation keeps the Clerk
account and audit history but immediately removes Convex record permissions.
No permanent account deletion or employee management is included.

The development Owner was provisioned during this implementation. Production
invite-only mode, credentials, bootstrap, and invitation emails must be configured
and verified separately. Test real acceptance using a second email you control;
CLI identity checks and mocked Clerk responses do not verify browser signup.

## Files and privacy

- Optional one PDF, maximum 2 MiB. Optional HTTP/HTTPS resume link remains.
- Check file size, MIME declaration, and `%PDF-` signature on both server and
  storage boundary. These checks are not antivirus scanning. The in-app viewer uses
  React-PDF canvas/text rendering with a locally bundled PDF.js worker, disabled
  eval, and disabled annotation links. Files are never embedded as arbitrary HTML.
  Downloads use attachment headers and `nosniff`.
- Store `Id<"_storage">`, filename, size, and MIME type. Never expose public
  Convex file URLs. Next.js forwards the staff JWT to an authenticated Convex
  file action, which checks active staff approval and audits viewing/downloads.
- Pending uploads expire after one hour. Cleanup runs every 15 minutes; bounded
  orphan scans run hourly to cover interruption between file storage and tracking.
  Attached resumes remain until their application is manually deleted.
- Manual deletion removes record and file. Audit records retain actor/reference,
  action, and timestamp, without applicant details or note content.
- No automatic record-retention period is invented. Finalize the organization,
  privacy contact, retention notice, and rights process before real collection.
- Resume link URLs are untrusted text in the admin detail view and are not fetched
  by the server or embedded in the dashboard.

## Production preparation (not deployed by this task)

Follow [the production setup checklist](PRODUCTION-SETUP.md) for the confirmed
production target, dashboard variable locations, manual deployment order, Owner
bootstrap, and acceptance checks. Development-only configure and smoke scripts
must not be used for production setup.

Use separate Convex and Clerk production instances. Set the Convex server secret
and issuer in the production backend. Configure keys independently on the frontend
host. Use real Turnstile keys, approved privacy settings, and HTTPS.

Production collection requires `SUBMISSIONS_ENABLED=true`,
`PRIVACY_POLICY_APPROVED=true`, `PRIVACY_ORGANIZATION`, `PRIVACY_CONTACT_EMAIL`, and
`PRIVACY_RETENTION_NOTICE`. Startup rejects incomplete enabled configuration.
Default-disabled builds and previews remain usable without submission secrets.

Set public URL to `https://www.taskwaveph.com` and admin URL to
`https://admin.taskwaveph.com`. Both hostnames serve the same Next.js project.
The admin hostname rewrites its root/navigation to the internal admin route tree;
public production hosts reject `/admin` and `/api/admin` paths. Localhost keeps
`/admin` only in development; production builds on localhost and Vercel preview
hostnames reject admin pages/APIs and Clerk auto-proxy paths. Admin-host public page paths are rejected. Configure
Clerk's production domain for the admin hostname and test cookies, callbacks,
recovery, and host routing before enabling collection.

Sitemap contains public pages only. Admin responses are private/no-store and
`noindex,nofollow`; its robots policy disallows crawling. These measures do not
replace backend authentication or approval checks.

Vercel Hobby restricts use to personal, non-commercial projects. Choose eligible
hosting before business launch. No DNS or production deployment was performed.
Current Convex free limits are bounded: consult the usage dashboard for database,
file storage, bandwidth, and function usage. There is no automatic paid upgrade or
secondary storage configured by this MVP.

## Failure handling and operational checks

Only confirmed writes return success. Validation/challenge failures return safe
400 errors, duplicate in-progress requests return 409, throttling returns 429, and
service failures return 503. Logs contain error types, not applicant data or secrets.
An ambiguous network result is retried using the same submission token. Do not
change the payload between retries without generating a new token.

Check Convex logs and usage after development smoke tests. No full-table dashboard
queries or unbounded table collection are used. Production DNS, public privacy
approval, real Clerk sign-in validation, and production submission checks must be
completed as separate launch steps with the owner’s accounts.

## Browser verification against local Convex

With the configured local Convex backend running, use `npm run test:submissions`.
It starts a separate development frontend on port 3101 using `.next-verify`,
submits synthetic application/PDF and business enquiry records, and checks safe
failure handling. Only the human widget is substituted with the official
Cloudflare test token; server verification and database/storage writes are real.
These tests create synthetic records that should be deleted after verification.
Do not run them against production.

The standard `npm run test:e2e` runs with submissions disabled and no Clerk keys,
so it does not depend on accounts or save personal data. Set `PLAYWRIGHT_PORT=3100`
if your normal development server already occupies port 3000.

## Local UI preview without Clerk keys

### Clerk CLI setup

The repository is linked to Clerk application `app_3K6WAnlhWMmeeTNkaYJRA5dAR4h`.
Use `clerk auth login`, then `clerk init --app app_3K6WAnlhWMmeeTNkaYJRA5dAR4h`
and `clerk doctor`. The CLI pulls development credentials into ignored `.env.local`.
Its generic scaffold may add public auth routes or a second root provider; keep
the existing admin-scoped provider and routes instead. Never print environment files.
Admin Clerk components use `@clerk/ui`'s shadcn theme and Poppins/brand overrides.
The `/__clerk/:path*` matcher follows the API matcher; auto-proxy requests reach
Clerk before admin page rewrites. Unconfigured auto-proxy requests fail closed.
Set the four documented Clerk route variables to `/admin/sign-in`, `/admin/sign-up`,
and `/admin` fallback destinations. CLI setup configures development only;
production credentials, domain verification, approved staff, and real browser
sign-in/sign-out verification remain separate requirements.

With `npm run dev` running, open `/dev-preview/login`,
`/dev-preview/applications`, or `/dev-preview/businessLeads`. These use the
shared login card and dashboard shell with explicitly labeled synthetic rows.
They do not query Convex or authenticate. Sample applicant edits/deletions persist
across client navigation until a full reload resets the preview. Routes require development
mode and a localhost hostname and return 404 in production. Actual staff access
continues to require configured Clerk keys and Convex staff approval.

## Applicant details, CVs, and exports

Click an applicant name to open the profile, CV, and submission tabs. Staff may
change status and internal notes; submitted profile fields stay read-only. A
confirmed deletion removes the record and its PDF. The list updates reactively.

`GET /api/admin/resumes/[id]?mode=view|download` checks Clerk plus active Convex
staff approval. Download is the default. The viewer renders one page at a time,
with previous/next page, zoom, and fit controls. External resume links are opened
separately, never fetched by the server or embedded.

`GET /api/admin/applications/export?format=csv|xlsx&status=New` exports every
matching row, including unloaded pages. Omit status for all applicants. Exports
check approval on each bounded backend page and again before returning the file.
They are uncached and contain applicant fields, tracking, consent, status/notes,
and CV filename, but no storage IDs, private URLs, fingerprints, or submission
tokens. CSV neutralizes formula prefixes; XLSX stores text as text, styles the
headings/rows, freezes the first row, and adds filters. More than 5,000 matching
records returns an error rather than a partial file. Concurrent changes mean an
export is a paginated read, not a transactional database snapshot.

## Synthetic development records and verification

- `npm run convex:seed`: idempotently inserts 50 labeled sample applicants and
  five separately stored valid two-page CVs.
- `npm run convex:seed:cleanup`: deletes only the versioned seed records/files.
- Both commands reject production targets and temporarily set the backend-only
  `ALLOW_DEVELOPMENT_SEED` flag, resetting it afterward. Never enable that flag
  on production. No seed function is a public API.
- `npm run convex:workflow`: verifies local database pagination, filtered export,
  details, status/notes updates, authorized CV metadata, deletion, and denied/revoked
  access using a trusted CLI test identity, revoked afterward. It deletes one
  seed applicant; rerun `convex:seed` to restore it. This does not verify real
  Clerk password login.
- With the localhost development site running on port 3000, `npm run test:preview`
  verifies list/detail navigation, status/notes editing, PDF pages and download,
  filtered CSV/XLSX exports including unloaded records, deletion, and mobile UI.
- `npm run test:submissions` verifies real Next.js → local Convex writes.

Sample details are at `/dev-preview/applications/sample-001`. Real submitted
records appear only in authenticated `/admin/applications`; synthetic UI previews
are not an authentication bypass and do not display private database records.
Actual staff sign-in verification still requires Clerk development credentials.

### Concurrent administrative edits

Applicant and lead review screens send the status/notes snapshot loaded by the
editor. The update transaction rejects `EDIT_CONFLICT` if either value changed
since that snapshot. Job edits send their loaded `updatedAt` revision; revisions
advance even for consecutive writes in one millisecond. Stale job saves are also
rejected. Conflict messages preserve entries and ask staff to copy changes,
refresh, and review the latest record. Job reactive updates preserve dirty fields;
successful saves reset the editor's dirty state. Inputs are disabled during saves.
These optional mutation arguments retain compatibility with trusted existing CLI
tools; new staff editing interfaces must supply the expected snapshot/revision.

Both Next.js and the authenticated Convex submission boundary use the bounded
request-stream reader. Malformed multipart or JSON input receives a safe validation
error, and oversized/stalled bodies stop before creating upload reservations.

## Careers and job postings

The owner approved job management on October 1, 2026. The `jobs` table stores
bounded plain-text title, service area, location, work arrangement, employment type,
description, responsibilities, requirements, optional salary text, status, and
publication/update timestamps. New jobs are Draft. Approved staff manage postings
at `/admin/jobs`; publishing and closing require explicit confirmation. Closed
records are retained, with metadata-only audit events.

Public `/careers` reads Published jobs in pages of 12 with service/work arrangement
filters. `/careers/[jobId]` shows the full role. Queries use indexes and return only
public posting fields. Missing/unpublished roles return 404; backend outages show
an unavailable state rather than invented vacancies. The dynamic sitemap includes
only published roles, bounded to 5,000 postings. Production admin-host routing
also supports `/jobs` and its child paths.

Role-specific links use `/apply?jobId=...` plus approved tracking parameters. Job
IDs are not tracking metadata. The form resolves the published title and makes the
position read-only. Next and Convex validate the payload; the save transaction
checks publication status and records the canonical title in `data.jobTitle` plus
`data.jobId`. Existing records and general applications need no migration because
these fields are optional. Exports append Job ID and Job Title at Application.
If a role closes during submission, no application or resume is retained; entered
information stays available and the applicant may continue as a general application.
An identical retry of a saved submission succeeds even after the role closes.

`/dev-preview/jobs` supports sample creation/editing and status changes without
Clerk. `/dev-preview/careers` shows only sample Published jobs and offers sample
role details/applications. These previews never query or mutate private records,
reset on reload, and are unavailable outside localhost development. On localhost development, `/careers` shows the same labeled sample jobs when
its unfiltered live list is empty. Sample admin edits persist across navigation to
that page and reset on reload. Real published jobs take precedence; production
and non-local hosts never show sample fallback data. Local Careers is noindex.

Run `npm run test:preview` for sample job workflows. `npm run convex:jobs:smoke`
verifies real development draft writes using a trusted temporary CLI identity,
then closes the synthetic draft and revokes approval. It never publishes a vacancy
and does not verify real Clerk password login. Staff login still needs Clerk keys.

## Public submission hardening and read caching

Public Next.js routes call the secret-protected Convex `/submission-attempt`
endpoint before reading multipart uploads or calling Turnstile. Persistent budgets
are shared across both forms: 20 attempts per address per 10 minutes and 120
attempts globally per minute. Save budgets remain 5 new submissions per address
per hour and 30 globally per minute. Completed identical retries remain
idempotent. A `429` response includes bounded `retryAfterSeconds` and `Retry-After`.
Backend attempt denials return normally so limiter updates commit.

On Vercel only, the deployment-overwritten `x-forwarded-for` value is validated
as an IP and HMAC-hashed using the server secret. Raw addresses are not stored or
logged. Direct/self-hosted requests use a shared fallback bucket; arbitrary client
headers cannot select rate buckets. Rotating the secret changes address buckets
and invalidates confirmation receipts. Limits are deliberately conservative;
shared office/QR-event networks share an address budget. This does not replace
platform denial-of-service protections. See [Vercel request header behavior](https://vercel.com/docs/headers/request-headers).

Uploads retain the 2 MB PDF limit plus 64 KB request overhead. Multipart stream
reading has a 30-second deadline and cancels on excess bytes or disconnect. The
attempt call times out after 5 seconds, Turnstile after 10 seconds, and Convex
submission after 30 seconds. The browser times out after 90 seconds, retaining
entries and the same token for unchanged retries because the save may have
completed. Editing an uncertain submission before retrying can create a distinct
application. Buttons also lock during sending/PDF validation, require a challenge,
and apply server cooldowns or a 3-second failure cooldown. Button restrictions do
not replace backend validation or rate limits.

Turnstile uses compact sizing when its container is below 300px, otherwise
flexible sizing. Script/widget errors provide a retry without navigating away or
saving entries in browser storage. The notice acknowledgment is separate from
form consent. Public responses deny framing and objects and restrict base URLs;
the CSP intentionally does not yet impose a strict script allowlist.

Careers lists bypass persistent fetch caching, just like role details, so a job
changed to Draft, Closed, or Archived disappears on the next page request. Already
open pages are snapshots until reloaded; this is not a live subscription.
Only sitemap generation caches its bounded first job page for 60 seconds in
production; cursor pages remain uncached. Keys include deployment URL, validated
filters, and page size; tracking and private records never enter these requests.
Development bypasses this cache. Role details are deduplicated only within one
render; transaction-time eligibility remains fresh. Sitemap revalidation may
serve stale URLs during refresh; an old URL cannot authorize an application save.
See [Next.js fetch caching](https://nextjs.org/docs/app/api-reference/functions/fetch).

Run `npm run convex:limits:smoke` to verify authentication and the persistent
20-attempt budget against the guarded development target. It consumes a synthetic
rate bucket and creates no applicant records. `npm run test:submissions` additionally
checks real development writes and real Cloudflare test-widget sizing; keep these
services separate from production.

## Admin overview and management

`/admin` is the protected overview; `/dev-preview` is its localhost-only synthetic
counterpart. Middleware requests private/no-store and noindex responses. Next.js
development mode overrides page cache-control to no-cache/must-revalidate; it
contains synthetic preview data only. Production previews remain unavailable.
Applications, Business Leads, and Jobs have separate list and detail
screens. Preview lead priority/status/notes/deletion and job archive/restore/delete
update preview state only. The sample first job has three linked applicants to
demonstrate blocked deletion. Exit preview clears sample jobs and leaves the workspace.

Staff account menus show Clerk profile information and offer explicit logout.
Real Clerk sign-in/logout still requires configured development keys and an approved
`adminUsers` record. Preview has no authenticated account and cannot read private data.

The `adminByTime` and `adminByStatus` Convex Aggregate components maintain exact
counts transactionally. Every application, lead, and job write, seed, and cleanup
must update them through `syncMetrics`. Chart buckets use Asia/Manila dates and
include retained records; deletion removes records from totals and chart buckets.
There is no revenue or conversion estimate. Recent activity exposes action metadata
only, excluding record content, staff identifiers, and internal notes.

After deploying this feature to the intended development deployment, run:

```bash
npx convex run overview:startBackfill '{}'
```

This internal migration uses idempotent, bounded batches and a `dashboardState`
readiness marker. Live writes synchronize during backfill. Counts remain hidden
until all three tables finish. Re-running is safe; if a scheduled batch fails,
inspect Convex logs and re-run the starter to resume from the beginning. Once ready,
the starter does not rebuild already synchronized counts. Do not edit source records
directly in the Convex dashboard; use application functions so aggregates stay correct.

Jobs now support Draft, Published, Closed, and Archived. Archived postings are
private and must return to Draft before publication. Deletion checks
`applications.by_jobId` in the same transaction and rejects linked jobs. Existing
applications keep their title snapshot. Lead priority is an optional boolean with
indexed priority/status filtering; missing values mean unstarred.

Run `npm run convex:admin:smoke` against the configured development target for
actual submissions, complete metrics, priority filtering, archive/restore, and safe
deletion. It temporarily publishes a clearly synthetic development role, cleans
its disposable applicant/lead/job records, and revokes its temporary CLI staff
approval. CLI identity testing is not real Clerk authentication. This command does
not configure or deploy production services.

## Public Web Analytics

The owner requested Vercel Web Analytics on October 2, 2026. The root layout mounts
the official Next.js SDK only on the configured public HTTPS host when
`VERCEL_ENV=production`. A public-path allowlist excludes administration,
development previews, confirmation pages, and arbitrary paths. `beforeSend`
removes queries/fragments from page-view URLs and rejects custom events or other
origins. No form fields or private records are sent as event properties.

Enable **Web Analytics** in the Vercel project dashboard and deploy the code to
start receiving page views. No additional secret or public environment variable
is required; existing `NEXT_PUBLIC_SITE_URL` must match the production host.
This integration does not add Speed Insights, session replay, or advertising.
The cookie notice version is now 2 so returning visitors see the revised notice.
Account-side enablement, usage limits, and live ingestion are not verified locally.
See [Vercel Web Analytics setup](https://vercel.com/docs/analytics/quickstart) and
[privacy information](https://vercel.com/docs/analytics/privacy-policy).

## Administrative resource limits

Exports now consume a persistent Convex budget before pagination/workbook creation:
five requests per staff account and twenty across the deployment per ten minutes.
Resume viewing and downloads share a separate budget: thirty per staff account and
120 across the deployment per minute, checked before storage reads. Authorization
is checked first, and denials return HTTP 429 with `Retry-After` and private/no-store
headers. Failed or disconnected requests can consume their initial allowance.

The Next.js export transport has a 25-second deadline. Resume transports have a
15-second deadline and cancel when the requesting browser disconnects. These
controls protect these expensive HTTP endpoints; ordinary authorized Convex
queries remain available and are not covered by the export budget.

Deploy the reviewed Convex functions before deploying the matching Next.js routes;
the new routes require `exports:begin` and the resume handler requires its internal
permit mutation. This audit has not deployed either service. No environment
variables or paid infrastructure were added.

## Recruitment campaign links and QR codes

On **Admin → Jobs**, open a **Published** posting. Open **Campaign link & QR**. In the modal, choose the source (for example `linkedin` or `facebook`), placement (`social`,
`paid-social`, `qr`, or `referral`), and a lowercase campaign code such as
`customer-support-october-2026`. Create the link, copy it for your post, or download
the 1024px PNG QR with the original TaskWavePH symbol centered on white backing.
It uses high error correction and retains the outer quiet zone. Scan the QR and test the role's application button
before sharing it. Do not include applicant information or referrer names in URLs.

The link opens the public role detail page and carries `source`, `campaign`,
`utm_source`, `utm_medium`, and `utm_campaign` through Apply. Its public origin
comes from `NEXT_PUBLIC_SITE_URL`; configure this as the public marketing domain,
never the admin domain. Keep the same campaign code across channels when comparing
results. Use QR placement for printed materials. Existing application eligibility
checks still reject new submissions after a role is withdrawn. Previously shared
links are not an assurance that a role remains open.

Under **Admin → Applications**, use the single filter card for status, submission
month, and source. **Advanced filters** reveals campaign, optional job selection
by title, and custom dates. Choosing a month sets its inclusive
Philippine calendar dates; editing a custom date clears the month. **Apply filters**
updates the table and exports together; **Clear filters** resets everything.
Source and campaign match exact case-sensitive codes. Manual Referred By remains
a separate private applicant field; this feature does not manage referrer accounts.

The **Export** dropdown offers a branded **PDF report** or **Excel workbook** using
all matching records, including unloaded pages. PDF is a landscape applicant list
with contact, role, status, attribution, applied filters, Poppins, the supplied
TaskWavePH symbol, and page numbers. Excel retains all exportable fields, an embedded
logo/title/filter banner, frozen headers, and alternating rows. Raw text remains
string cells, never formulas. CSV remains supported for existing API integrations
but is not offered in this dropdown. The campaign-results panel is no longer shown.

Reads first narrow by campaign, job ID, source, status, or submission time using
indexes; dynamic combinations filter bounded pages without losing cursors. Sparse
matches can return an empty page with a Load more button. Exports stop at 5,000
matching records, 100 underlying pages, or 25 seconds, returning an error instead
of a partial file. Narrow filters if a limit is reached. The persistent export
budget is five requests per staff account per ten minutes and twenty globally.
Every page requires an active approved staff identity; responses remain
private/no-store. Deploy the matching backend before releasing the frontend,
including PDF audit support. No new environment variables are needed.

The server export route explicitly traces its public logo and Poppins font files
into the deployment bundle. Preview exports fetch only these fixed public brand
assets and use synthetic records. Local campaign links open explicitly synthetic
URLs under `/dev-preview/careers`; preview forms remain disabled for collection.

## Applicant lookup, lead follow-ups, and Owner activity

Applications has one **Search applicants** input for an application reference,
name, or email. Click **Apply filters**; search composes with status, job, source,
campaign, and Philippine date filters. Exact email lookup uses `by_email` (case
insensitive after normalization). Name/reference words use Convex full-text search,
with the last word matched as a prefix, and additional exact words checked on the
bounded result page. There is no typo correction or arbitrary substring search.
Non-email queries accept up to 16 words, each at most 32 characters. Empty searches
retain normal chronological pagination. Sparse search/date combinations can return
empty pages with Load more. Search queries are subject to Convex's search limits;
failed/oversized exports never return a partial file as a complete export.

Job filters select a posting title and status and retain its ID internally. All
statuses are available to staff; load more job options when needed. Source and
campaign inputs suggest existing exact codes and still accept custom codes.
Suggestions are bounded to the first 50 distinct nonempty codes per dimension,
read by jumping between indexed values. Standard campaign channels are also
suggested. These controls do not introduce a campaign registry.

The UI sends export filters in a bounded JSON POST body, including applicant search
terms; names and emails never enter navigation or export URLs. Legacy GET exports
remain available for non-search filters only. Both methods require staff approval,
consume the same persistent budget, and return private/no-store responses.

After deploying the backend, backfill historical optional search fields before
releasing the corresponding frontend:

```bash
npx convex run admin:backfillSearch '{"cursor":null}'
```

The trusted internal migration processes 100 rows per batch and schedules remaining
pages. Re-running is safe. Use the explicitly intended deployment; production
migration/deployment requires separate owner authorization. New intake and seed
records populate the index field at creation. The search field duplicates existing
private profile data and is never exported or exposed through public job reads.

Business Lead details has an optional **Next follow-up** calendar date. Empty means
no reminder. Dates are validated (2000–2100), saved with the loaded status/notes/date
snapshot, and reject stale edits transactionally. Overdue means an open enquiry's
date is before today in the Philippines; today and Closed enquiries are excluded.
The dashboard count uses the existing full-table aggregate, updated on date,
status, and deletion changes. No email reminders are sent. Existing records have
no date, so they add no overdue entries; normal aggregate backfill remains safe.

**Activity** is visible only to Owners. Its paginated database query independently
requires an active Owner; Staff and unapproved sessions cannot obtain history.
Records contain existing action/record/time/actor metadata only. Staff labels are
resolved from staff approval records; historical actors without a label show their
identifier. No applicant profiles or internal notes are joined. Recent dashboard
activity is also Owner-only. The admin hostname serves `/activity`; public and
preview production hosts retain their existing private-route blocks/noindex.

The public application form separates required contact/role fields, optional
experience/availability, optional screening, CV/work samples, and additional
information. Previous salary stays optional. PDF selection shows checking/ready
states; it does not claim an upload has occurred. Real upload progress measures
request bytes, then separately waits for server validation/save. A 100% upload
never implies a successful save; confirmation still requires the confirmed save
and signed receipt. Upload retries retain the existing idempotency token and
90-second abort behavior. No browser persistence is added.

Development verification on October 3, 2026: deployed to `exuberant-lapwing-339`,
backfilled historical search fields, and verified real synthetic saves, indexed
search/matching exports, follow-up updates/clearing, overdue totals, stale-save
rejection, and Staff/anonymous activity denial. Disposable records were removed
and temporary CLI approval revoked; metadata-only audit history remains. Owner
query acceptance is verified in backend tests. Real Clerk browser authentication
and production acceptance remain unverified.

Repeat the guarded development workflow with:

```bash
node scripts/smoke-admin-productivity.mjs
```

### Submission and export response safeguards

Private export JSON requests are limited to 8,192 bytes and retain field-level
validation, allowing valid multibyte source and campaign codes. CV upload transport
settles safely for bodyless HTTP responses and malformed response headers; these
responses cannot leave the form locked or produce a false success confirmation.
The ready-to-submit CV message is hidden while submission is in progress.

### Owner QR and campaign settings

`/admin/settings` (or `/settings` on the configured admin hostname) is Owner-only.
`settings.read` requires active staff approval; `settings.save` additionally
requires Owner role. `ownerSettings` holds one indexed QR settings document.
Updates check the editor revision transactionally, throttle to ten saves per
Owner per minute, and record metadata-only `qr_settings_updated` activity.
Concurrent changes never overwrite unsaved edits; discard reloads current values.

Settings include solid/diagonal-gradient dark colors, supplied symbol/wordmark/no
logo, bounded logo sizes, and campaign channel/placement defaults. The backend
validates allowed values and at least 4.5:1 contrast against fixed white. This
protects contrast, not universal scan reliability; test downloaded codes before
printing. Original logo proportions, four-module quiet zones, and H error
correction remain fixed. Rounded module patterns are not implemented. Defaults initialize newly loaded campaign forms; QR designs apply to new downloads.
Already shared PNG files and URLs remain unchanged. Staff cannot save settings.

Settings preview URLs reflect the selected channel and placement using a sample
campaign code. They never include applicant data. Existing campaign drafts retain
their selected channel and placement when another owner changes defaults.

`/dev-preview/settings` is a synthetic localhost-only Owner UI preview. It cannot
read or write private settings and resets on reload. Owner management links reuse
Users and Activity. Privacy wording, secrets, hosts, and service configuration
remain deployment configuration, not browser-editable settings.

### Owner PNG uploads for QR logos

Owners select **Upload QR logo** in Settings, preview locally, then save. Static
PNG only, up to 1 MB, dimensions up to 2048 × 2048. Client image decoding and
server signature/chunk/CRC/dimension checks reject malformed structures and
animated PNGs; these checks are not malware scanning. Original file proportions
are preserved in QR generation. The website logo is unaffected.

`qrLogos.save` is a Clerk-authenticated action. It checks active Owner approval,
persistently throttles attempts before validation/storage, and rechecks Owner
approval and the settings revision inside the save mutation. Only a storage ID
is persisted in the optional `ownerSettings.logoStorageId`; no arbitrary URLs.
Failure cleanup checks whether the file was committed before deleting it.
Unlinked files have a scheduled one-hour cleanup; replacement or switching to an
official/no-logo option deletes the previous custom image transactionally.

Approved Staff read the saved PNG through `/api/admin/qr-logo`, which forwards a
Clerk Convex token to the private `/qr-logo` HTTP action. Both responses use
private/no-store and nosniff. File reads share the existing private file-read
budget. No public storage URL is returned. Temporary preview selections stay in
memory and never upload or call private endpoints on `/dev-preview/settings`.
Deploy the development backend before opening the updated live Settings page.

### Event campaigns without a job

Owners can open **Settings → Event campaigns → Create event campaign & QR**,
enter a code such as `com-sayahan-2026`, choose the channel and placement (`qr`
for print), and create a link or download its QR. The link opens `/apply`
without a job ID and uses the configured public site origin. QR downloads use
saved branding; save branding changes first. These codes do not need a database
campaign record. Use the same code consistently for the event.

Confirmed applications retain the code. In **Applications → Advanced filters**,
enter the exact campaign code and apply filters to review matching submissions
and export their results. This measures submitted applications, not scans,
clicks, or conversion rates. Preview links open a disabled synthetic general
application and never collect records.

Run `node scripts/smoke-campaigns.mjs --general` for guarded development-only
verification of general application saves, matching campaign filters/exports,
and anonymous access denial. It deletes disposable applications and revokes its
temporary CLI staff approval; it does not verify real Clerk browser login.

Development verification on October 5, 2026: the general event campaign smoke
passed real saves without job IDs, exact channel/campaign filters, matching
protected exports with QR attribution, current-status filtering, and anonymous
access denial. Disposable records were removed and temporary CLI staff approval
revoked. Real Clerk browser authentication remains unverified.
