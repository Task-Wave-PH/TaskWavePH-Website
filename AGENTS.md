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
- Tables: applications, businessLeads, jobs, adminUsers, adminActivity, pendingUploads.
  Convex rate-limiter component supplies persistent throttling.
- Administrative functions require verified Clerk identity AND active adminUsers
  approval. Authentication alone grants no record access. Staff provisioning is
  an internal mutation invoked from trusted CLI/dashboard access.
- Store resume storage IDs, not public file URLs. Each download checks permission.
  PDF only, optional, up to 2 MB; signature/type checks are not malware scanning.
- Preserve only source, campaign, utm_source, utm_medium, utm_campaign and pathname
  landing_page. Never put applicant information in URLs or logs.
- Submissions require unselected consent, Turnstile, honeypot validation, length
  limits, server timestamps, and idempotency tokens. Success follows confirmed save.
- Application statuses: New, Reviewed, Shortlisted, Closed. Lead statuses: New,
  Contacted, Closed. Notes are internal and bounded to 2,000 characters.
- Record deletion deletes attached resumes. Clean unlinked uploads after one hour.
  Audit records contain metadata only; do not copy personal information or notes.

## Pages and design

The public marketing audience is business clients. Home, Services (at /areas-of-work),
How It Works, and About explain outsourcing services and lead to business enquiries.
Careers and Apply retain the applicant journey. Shared CTAs must follow page audience.

Public routes: /, /areas-of-work, /how-it-works, /careers, /about, /apply,
/business-enquiry, /privacy, and confirmation routes. Service areas are not verified
vacancies; only approved staff-published job postings are vacancies. Do not invent roles, employee benefits, statistics, or contacts.

Prefer existing shadcn primitives styled with official brand tokens. Preserve
original logos, Poppins, navy/blue/cyan/white identity, and mobile-first layouts.
Use server components except for needed interactivity. Check 360, 390, 430, 768,
1024, and 1440 pixel layouts, keyboard access, contrast, and reduced motion.

Admin uses a branded shadcn Sidebar, paginated records, filters, detail editing,
protected CV viewing/downloads, CSV/styled XLSX exports, and confirmed deletion. No public sign-up or dashboard links.
Development uses /admin. Configured production admin hostname rewrites to this
route tree; the public hostname blocks admin paths. Exclude admin from sitemap,
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

## Job postings

- Careers lists only Published jobs. Draft and Closed postings are private.
- Approved staff create/edit bounded plain-text postings and explicitly confirm
  publication or closure. Preserve closed postings and existing applications.
- Optional application job IDs are validated inside the save transaction; store
  the server-resolved title snapshot. Reject new applications for unavailable jobs,
  while honoring identical retries of already saved submissions.
- Public job reads expose only posting content; all administration retains Clerk
  identity plus active staff approval. Preview jobs never write to the database.
- Sitemap includes only published job URLs, bounded to 5,000 postings.
