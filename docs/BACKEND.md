# Convex MVP setup

## What is implemented

Applications and business leads are stored in Convex. Optional PDF resumes are
stored in Convex file storage. Next.js validates form requests, verifies Turnstile,
and calls a secret-authenticated Convex HTTP action. The backend revalidates,
throttles, reserves the submission token, stores the file, and commits a record.
Repeated identical submissions return the same reference. Changed payloads must
use a new token. Failed requests never produce the success navigation.

Staff use Clerk email/password authentication. Every administrative query,
mutation, and download also checks `adminUsers`. Approved staff can review records,
filter by status, edit notes, download PDF resumes, and permanently delete records.
The dashboard uses the brand palette and shadcn Sidebar/Select/Card primitives.

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
   No public sign-up route is included. Set the publishable key, secret key, and
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
7. Set `SUBMISSIONS_ENABLED=true` for local development only. Start `npm run dev`.
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

## Files and privacy

- Optional one PDF, maximum 2 MiB. Optional HTTP/HTTPS resume link remains.
- Check file size, MIME declaration, and `%PDF-` signature on both server and
  storage boundary. These checks are not antivirus scanning. Do not render uploads
  inline; downloads use attachment headers and `nosniff`.
- Store `Id<"_storage">`, filename, size, and MIME type. Never expose public
  Convex file URLs. Next.js forwards the staff JWT to an authenticated Convex
  download action, which checks active staff approval and audits the download.
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

Use separate Convex and Clerk production instances. Set the Convex server secret
and issuer in the production backend. Configure keys independently on the frontend
host. Use real Turnstile keys, approved privacy settings, and HTTPS.

Production collection requires `SUBMISSIONS_ENABLED=true`,
`PRIVACY_POLICY_APPROVED=true`, `PRIVACY_ORGANIZATION`, `PRIVACY_CONTACT_EMAIL`, and
`PRIVACY_RETENTION_NOTICE`. Startup rejects incomplete enabled configuration.
Default-disabled builds and previews remain usable without submission secrets.

Set public URL to `https://taskwaveph.com` and admin URL to
`https://admin.taskwaveph.com`. Both hostnames serve the same Next.js project.
The admin hostname rewrites its root/navigation to the internal admin route tree;
public production hosts reject `/admin` and `/api/admin` paths. Localhost keeps
`/admin` for development. Admin-host public page paths are rejected. Configure
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
