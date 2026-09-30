# TaskWavePH

Repository foundation for a Philippine BPO, staffing, and recruitment website.
Read [AGENTS.md](AGENTS.md) before changing the project.

For company positioning, official colors, Poppins typography, taglines, and logo
usage, read [DESIGN.md](DESIGN.md). Original logo files are in `public/logo/`; the
media kit, latest sticker sheet, and production brief are in `docs/brand/`. The
reference distinguishes source specifications from implementation guidance. The
website still uses foundation branding pending a separate implementation feature.

## Current milestone

Includes a basic landing page, applicant form, campaign tracking, confirmation
route, draft privacy notice, shared validation, and tooling. The form only
validates locally. It does not send or save applicant information or redirect to
confirmation. Google Sheets and the application API are the next isolated feature.

## Local setup

Use Node.js 22 (22.12 or newer) and npm. Exact dependencies are in the lockfile.

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Google credentials can remain blank for this
milestone. No Google account or spreadsheet is needed to build or test.

## Commands

| Command                | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Development server with Turbopack       |
| `npm run lint`         | ESLint                                  |
| `npm run typecheck`    | Route types and strict TypeScript       |
| `npm run format`       | Format source and docs                  |
| `npm run format:check` | Check formatting                        |
| `npm run test`         | Vitest boundary validation tests        |
| `npm run build`        | Production build                        |
| `npm run start`        | Serve the production build              |
| `npm run test:e2e`     | Playwright against the production build |

Install the test browser once:

```bash
npx playwright install chromium
```

Verification sequence:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run build
npm run test:e2e
```

E2E tests start their own production server at `127.0.0.1:3000`; keep that port
free. They use synthetic applicant data and never write to Google Sheets.

## Organization

- `app/`: App Router pages, metadata, sitemap, and robots.
- `components/`: shadcn/ui components, shared layout, interactive form.
- `features/applications/`: shared schema, inferred input/output types, tracking.
- `lib/`: server environment access and utility functions.
- `tests/`: unit and browser tests.
- `public/logo/`: original brand logo assets.
- `docs/brand/`: original media-kit and merchandise references.

Keep secrets and Google SDK usage in server modules. The future flow is
`POST /api/applications` → application service → Sheets adapter. The shared form
schema contains no storage-specific fields; replacing the service’s datastore
with Convex will not require rebuilding the frontend.

## Environment variables

| Variable                         | Foundation behavior                                                   |
| -------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Absolute HTTP/HTTPS URL; defaults to `http://localhost:3000`          |
| `GOOGLE_SHEETS_SPREADSHEET_ID`   | Unused until integration; required when the server accessor is called |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`   | Same; must be a valid email                                           |
| `GOOGLE_PRIVATE_KEY`             | Same; PEM key supporting actual or escaped `\n` newlines              |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional, reserved and unused                                         |
| `TURNSTILE_SECRET_KEY`           | Optional server secret, reserved and unused                           |

`lib/env.ts` is protected with `server-only`. Google configuration validation
reports variable names without secret values. `.env.local`, credentials JSON,
and private-key files are ignored. `.env.example` is safe to commit.

## Campaign URLs

```text
/apply?source=cite&campaign=job-fair-oct-2026
/apply?source=office-qr
/apply?source=facebook&utm_campaign=csr-hiring
```

Only `source`, `campaign`, `utm_source`, `utm_medium`, and `utm_campaign` are
captured, each limited to 200 characters. Home CTAs preserve these parameters.
For repeated parameters the first value is used. `landing_page` is pathname only.
Never include applicant details in QR URLs. Tracking values are attribution,
not trusted identity or authorization.

## Deployment preparation and next feature

Next.js uses the default Vercel build configuration. Set
`NEXT_PUBLIC_SITE_URL=https://taskwaveph.com` for production and use an appropriate
URL for previews. GitHub publishing, Vercel setup, and DNS are not part of this
foundation. Run checks before opening a pull request.

Before enabling real submissions:

1. Add a server POST handler, application service, and isolated Sheets adapter.
2. Configure the Sheets API/service account and share the Applications worksheet.
3. Add production startup checks for required credentials; separate development,
   preview, and production spreadsheets.
4. Add server IDs/timestamps, row mapping, safe storage/error handling, and tests.
5. Enable Submit Application and redirect only after a confirmed append.
6. Finalize the draft privacy notice (organization, contact, retention, rights).
7. Verify a production submission and a real QR scan before launch.

No permanent database, Convex, authentication, admin dashboard, or CRM is added.
