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
npm run test:e2e
npm run convex:check
npm run convex:smoke
# With local Convex running:
npm run test:submissions
```

Backend tests cover permissions, revocation, retries, rate limits, cleanup,
validation, and file deletion. The smoke command creates synthetic development
records only. Production is a separate milestone; real collection remains gated
on finalized privacy details and service configuration.

## Project guidance

Read [AGENTS.md](AGENTS.md) and [DESIGN.md](DESIGN.md). Preserve official artwork
and source-backed company copy. Convex is the source of truth; Sheets sync,
employees, applicant accounts, job management, payroll, and CRM are deferred.
