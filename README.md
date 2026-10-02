# TaskWavePH

A branded recruitment and business support website built with Next.js, shadcn/ui,
TypeScript, Convex database/file storage, and Clerk staff authentication.

## Development

```bash
npm install
npm run dev
```

`.env.local` is ignored by Git. Copy `.env.example` for a fresh environment.
Submissions default to disabled; forms provide local validation until development
services are configured. See [backend setup](docs/BACKEND.md) for the complete
Convex, Clerk, Turnstile, staff-access, and subdomain workflow.

## Routes

Home, Areas of Work, How It Works, Careers, About, Apply, Business Enquiry, and
Privacy are public. Confirmation pages are excluded from indexing. Admin is
available locally at `/admin` and is designed for `admin.taskwaveph.com` in
production. It is excluded from the sitemap and requires staff authentication
plus backend approval. Applicants and businesses do not need accounts.

## Verification

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run build
npm run test:e2e # builds an isolated production fixture first
npm run convex:check
npm run convex:smoke
npm run convex:seed
npm run convex:workflow
# With the local development website on port 3000:
npm run test:preview
# With local Convex running:
npm run test:submissions
```

The public browser command always builds `.next-verify` with live services and
submissions disabled, regardless of `.env.local`. It uses port 3100 by default;
set `PLAYWRIGHT_PORT` to choose another port. Pass focused tests after `--`.
It preserves the development server and live jobs. Do not replace it with bare
`playwright test` against an old build containing configured provider URLs.

GitHub runs the same quality gate for PRs and main; it performs no deploys, seeds,
production writes, or invitations. See [launch acceptance](docs/LAUNCH-CHECKLIST.md)
and [backup/recovery](docs/RECOVERY.md) for remaining production verification.

Backend tests cover permissions, revocation, retries, rate limits, cleanup,
validation, and file deletion. The smoke command creates synthetic development
records only. Production is a separate milestone; real collection remains gated
on finalized privacy details and service configuration.

## Project guidance

Read [AGENTS.md](AGENTS.md) and [DESIGN.md](DESIGN.md). Preserve official artwork
and source-backed company copy. Convex is the source of truth; Sheets sync,
employees, applicant accounts, payroll, and CRM are deferred.

Applicant names open detail pages with profile, CV and submission tabs. Staff can
review status/notes, view/download PDFs, delete records, and export all matching
applicants to CSV or styled Excel. Local UI samples are available at
`/dev-preview` (overview) and `/dev-preview/applications`; they are separate from
authenticated database records. Business Leads supports priority stars, status,
notes, and confirmed deletion. Jobs supports archive/restore and deletion only
when no applications are linked. See `docs/BACKEND.md` for metric backfill and
`npm run convex:admin:smoke` for development verification.
Use `SUBMISSIONS_ENABLED=development` for local form writes without enabling
production collection.

### Job postings

Careers now supports published roles, filters, role details, and job-associated
applications. Staff publishing remains protected by Clerk and Convex approval.
Try `/dev-preview/jobs` and `/dev-preview/careers` locally for sample posting
workflows without authentication. See `docs/BACKEND.md` for configuration and
limitations. Verify development draft writes with `npm run convex:jobs:smoke`.
