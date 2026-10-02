<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TaskWavePH — Project Instructions

Read [DESIGN.md](DESIGN.md) before branding or UI changes and inspect existing code.
The owner approved Convex, business enquiries, PDF resumes, and an admin dashboard
on October 1, 2026. This supersedes the original Sheets-only MVP constraints.

## Scope and architecture

- Next.js App Router, strict TypeScript, Tailwind, shadcn/ui, React Hook Form,
  Zod, Lucide, Convex database/file storage, and Clerk staff authentication.
- Convex is the source of truth. Google Sheets sync is deferred. Do not add
  another datastore, object store, CRM, employee management, or applicant login.
- Public forms POST through Next.js services to the authenticated Convex HTTP
  adapter. Keep the shared secret server-side. Backend functions validate again.
- Tables: applications, businessLeads, jobs, adminUsers, staffInvitations, adminActivity, pendingUploads,
  dashboardState (internal metric readiness).
  Convex rate-limiter supplies persistent throttling; aggregate components supply
  exact private dashboard counts. Synchronize all write paths, including seeds.
- Administrative functions require verified Clerk identity AND active adminUsers
  approval. Authentication alone grants no record access. Owners alone manage
  staff roles, invitations, and activation. Existing approvals without a role are
  Staff. Bootstrap Owners through trusted internal provisioning; never remove the
  last active Owner, including through CLI provisioning.
- Store resume storage IDs, not public file URLs. Each download checks permission.
  PDF only, optional, up to 2 MB; signature/type checks are not malware scanning.
- Preserve only source, campaign, utm_source, utm_medium, utm_campaign and pathname
  landing_page. Never put applicant information in URLs or logs.
- Submissions require unselected consent, Turnstile, honeypot validation, length
  limits, server timestamps, and idempotency tokens. Success follows confirmed save.
- Confirmation pages require a signed, kind-specific HttpOnly receipt issued
  after save. Receipts expire after 10 minutes; direct access without one redirects
  to the matching form. Keep confirmation responses private/no-store and noindex.
- Application statuses: New, Reviewed, Shortlisted, Closed. Lead statuses: New,
  Contacted, Closed. Notes are internal and bounded to 2,000 characters.
- Record deletion deletes attached resumes. Clean unlinked uploads after one hour.
  Audit records contain metadata only; do not copy personal information or notes.
- Staff review editors send their loaded status/notes snapshot; job editors send
  their loaded updatedAt revision. Reject stale saves transactionally and preserve
  unsaved entries. Never remount a dirty editor on reactive record updates.

## Pages and design

The public marketing audience is business clients. Home, Services (at /areas-of-work),
How It Works, and About explain outsourcing services and lead to business enquiries.
Careers and Apply retain the applicant journey. Shared CTAs must follow page audience.

Public routes: /, /areas-of-work, /how-it-works, /careers, /about, /apply,
/business-enquiry, /privacy, /terms, and confirmation routes. Service areas are not verified
vacancies; only approved staff-published job postings are vacancies. Do not invent roles, employee benefits, statistics, or contacts.

Prefer existing shadcn primitives styled with official brand tokens. Preserve
original logos, Poppins, navy/blue/cyan/white identity, and mobile-first layouts.
Use server components except for needed interactivity. Check 360, 390, 430, 768,
1024, and 1440 pixel layouts, keyboard access, contrast, and reduced motion.

Admin uses a branded shadcn Sidebar, paginated records, filters, detail editing,
protected CV viewing/downloads, CSV/styled XLSX exports, and confirmed deletion. No public marketing sign-up or dashboard links.
Staff account creation requires an Owner invitation and Clerk invite-only mode.
The registration route accepts invitation tickets; ordinary login has no signup
link. Activate only after server-verified Clerk email and invitation metadata match
a pending, unexpired invitation from an active Owner. Ignore user-editable metadata.
Revocation/deactivation removes eligibility immediately; keep account/audit history.
Invitations last seven days; operations are persistently throttled and retry uncertain
sends through reconciliation. Keep the matching Clerk secret in the Convex backend.
Localhost development uses /admin. Deployed administration, APIs, and Clerk
auto-proxy are restricted to the configured admin hostname; public and Vercel
preview hosts cannot access administration. The admin hostname rewrites to this
route tree. Exclude admin from sitemap,
add noindex, and send private/no-store responses. Host routing is not authorization.

## Configuration and delivery

- Document variables in .env.example; .env.local and .convex are git-ignored.
  Never commit secrets, private keys, or service-account credentials.
- Read docs/BACKEND.md for Convex/Clerk/Turnstile setup, trusted staff provisioning,
  local development verification, production domain configuration, and limitations.
- Submissions default to disabled and local preview remains functional. Production
  additionally requires approved privacy policy, organization/contact/retention
  configuration, real Turnstile keys, and separate production services.
- This task builds and tests development integration. Do not deploy, change DNS,
  enable production collection, or merge without an explicit follow-up instruction.
- Preserve feature-friendly structure and isolate service/storage code from UI.
- Use feature branches and conventional commits; meaningful merges use PRs.
- Run lint, typecheck, formatting check, unit/backend tests, build, and browser
  checks. Verify actual Convex development writes; report unavailable external
  authentication verification explicitly rather than claiming mocked login is real.
- Read the Convex expert skill before editing convex/. Use object-form functions,
  args/returns validators, proper generated imports, indexed reads, and pagination.
- Keep this file and DESIGN.md accurate when scope or brand guidance changes.

## Applicant review extension

- Applications include an optional Referred by name/code (trimmed, max 200
  characters). Save it only as private application data, display it read-only,
  and include it in protected exports. Never include it in tracking URLs or logs.

- Read docs/HIRING-REFERENCE.md for the owner-approved screening reference.
  Additional screening fields are optional; preserve historical records and each
  job's work arrangement. Missing-information requests are copied for staff
  review, never automatically sent. Do not adopt OneMiners-specific contacts,
  office details, schedules, photo requirements, or intern offers as TaskWavePH policy.

- Applicant profile fields are read-only; staff edit status and internal notes.
- Render private PDFs with React-PDF and a local worker, without document scripts
  or annotation navigation. Never expose public storage URLs.
- Applicant exports include all matching status-filtered rows, with a 5,000-row
  limit, bounded pagination, approval checks, CSV formula neutralization, and
  explicit XLSX string cells. Export no tokens, fingerprints, or storage IDs.
- Development preview state is synthetic and resets on reload. It must never
  query private records or bypass authentication. All preview routes return 404
  outside localhost development.
- Seeds are internal, idempotent, version-marked, and development-only; cleanup
  targets only owned synthetic records and attached files. Keep the backend seed
  flag disabled after use and never enable it in production.

## Cookies and policy content

- Public pages use an informational essential-cookie notice, not optional tracking
  consent. A versioned acknowledgment cookie lasts 180 days. Keep it separate from
  form consent and never add analytics or advertising integrations implicitly.
- The owner explicitly requested Vercel Web Analytics on October 2, 2026. Track
  public pages only on the configured production site origin. Strip page-view URL
  queries/fragments; exclude admin, local/preview, confirmation routes, custom
  events, and all form contents. Keep public privacy/cookie descriptions accurate.
- Footer cookie information can be reopened; admin and preview pages omit the notice.
- Privacy content uses configured organization/contact/retention values and stays
  a development draft until production privacy configuration is complete and approved.
  The owner approved the current Website Terms for publication on October 2, 2026.
  Public policies use plain language and service-provider categories rather than
  stack names, deployment details, or internal access workflows. Preserve data-use,
  overseas-processing, retention, consent, cookie, and rights disclosures.
  Keep their published label; substantive changes require owner review. Do not invent legal contacts,
  retention periods, operational agreements, or compliance claims.
- The How It Works timeline expands the existing three-step enquiry journey. It is
  website guidance inspired by the brand, not an official media-kit onboarding process.

## Job postings

- Careers lists only Published jobs. Draft, Closed, and Archived postings are private.
- Archived jobs restore to Draft before publication. Jobs with linked applications
  cannot be permanently deleted; check the indexed association in the transaction.
- Leads support an optional priority star (missing means false), not custom CRM tags.
- The admin overview uses full-table transactional aggregates and Philippine dates,
  independent of list pagination/filters. Backfill existing data before displaying totals.
- Approved staff create/edit bounded plain-text postings and explicitly confirm
  publication or closure. Preserve closed postings and existing applications.
- Optional application job IDs are validated inside the save transaction; store
  the server-resolved title snapshot. Reject new applications for unavailable jobs,
  while honoring identical retries of already saved submissions.
- Public job reads expose only posting content; all administration retains Clerk
  identity plus active staff approval. Preview jobs never write to the database. On localhost development, Careers
  shows labeled sample jobs when its unfiltered live list is empty; it shares
  state with sample admin tools. Production never uses this fallback.
- Sitemap includes only published job URLs, bounded to 5,000 postings.

## Public navigation and confirmed location

- Public headers remain sticky. Below 1024px show the logo and menu button only;
  put the audience-specific CTA inside the mobile menu. Retain tracking and keyboard
  access, and offset anchor/error focus targets below the header.
- The owner confirmed Dagupan City, Pangasinan, Philippines. Use the shared company
  location; do not infer a street address, office hours, or visitor arrangements.
- Keep motion subtle: smooth anchors and short interaction transitions, disabled
  for reduced motion. Keep standard Next.js route navigation.

## Submission reliability and public caching

- Protected export requests consume persistent per-staff/global budgets before
  fetching records or creating workbooks (5/20 per ten minutes). Resume reads
  consume separate budgets before file access (30/120 per minute). Return private
  HTTP 429 responses with Retry-After; authorization must precede budget checks.
- Cancel protected upstream fetches when callers disconnect and keep bounded
  deadlines. These endpoint limits do not replace backend authorization or cap
  every authenticated Convex query.
- Attempt throttling runs before upload reading and challenge verification. Use
  the existing persistent Convex limiter; return denials so budget updates commit.
  Keep bounded retry timing and safe public error codes, including JOB_UNAVAILABLE.
- Trust forwarding headers only on Vercel deployments; hash validated addresses,
  never store/log raw IPs. Other hosts share a conservative fallback bucket.
- Preserve idempotency tokens for unchanged retries after uncertain failures.
  Disabled buttons/cooldowns supplement server protections. Challenge retries
  retain entries without browser-storage persistence.
- Careers lists and role details read current published jobs without persistent
  caching. Only sitemap generation may cache a bounded first job page for 60
  seconds in production. Keep private data, arbitrary cursors, tracking, and
  eligibility checks uncached; saves always check current job status.
