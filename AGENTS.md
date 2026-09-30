<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TaskWavePH — Project Instructions

Brand story, official colors, typography, taglines, and asset provenance are
documented in [DESIGN.md](DESIGN.md). Read it before brand, copy, imagery, or UI
work; local original references are under `docs/brand/` and `public/logo/`.

## 1. Project goal

Build a Philippine BPO/staffing and recruitment website. The MVP journey is:

```text
QR code → landing page / apply → applicant form → server validation
→ Google Sheets → /apply/success
```

Google Sheets is the temporary applicant datastore. Do not add a permanent application database. Keep storage isolated so Convex can later become the source of truth without rewriting the frontend.

## 2. MVP scope

Build a landing page, applicant form, QR/source tracking, Sheets integration,
client/server validation, confirmation, basic errors, mobile layout, SEO,
privacy consent, spam protection structure, documentation, environment setup,
and deployment configuration.

Do not build applicant login, admin dashboard, CRM, Convex, Supabase, pipelines,
interviews, job management, client portal, complex authentication, microservices,
Redis, or queues.

## 3. Stack

Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, React Hook Form,
Zod, Lucide React, Google Sheets via googleapis, Vercel, Cloudflare DNS, GitHub,
Vitest, Playwright, Prettier, and ESLint. Use current stable compatible packages;
retain compatible pinned versions in an existing repository.

Prefer existing shadcn/ui components and variants wherever they fit the UI.
Customize them with the TaskWavePH tokens and media-kit design guidance. Keep
semantic sections, lists, and native anchor navigation when no component adds value.

## 4. Architecture

The browser must never communicate directly with Google Sheets. All credentials
stay server-side. The future flow is POST route → shared validation → application
service → Google Sheets adapter → confirmed success.

## 5. Repository structure

Use root-level `app/`, `components/ui/`, `components/layout/`,
`components/application/`, `features/applications/`, `lib/`, `public/`,
`tests/unit/`, and `tests/e2e/`. Introduce folders and files when they solve an
actual organizational problem. Defer unused service and adapter stubs.

## 6. Routes

- `/`: landing page.
- `/apply`: general form with source/campaign/UTM parameters.
- `/apply/success`: submission confirmation, excluded from indexing.
- `/privacy`: applicant privacy notice.
- `/api/applications`: future POST-only server submission endpoint.

## 7. Applicant fields

First Name, Last Name, Email, Mobile Number, City / Location, Position Interested
In, Years of Experience, Current Employment Status, Availability, optional Resume
Link, Message / Notes, and Privacy Consent.

Capture source, campaign, utm_source, utm_medium, utm_campaign, landing_page, and
server-generated submitted_at. Tracking is controlled by URLs, not hard-coded
campaign logic. Example: `/apply?source=cite&campaign=job-fair-oct-2026`.

## 8. Validation

Use one centralized Zod schema on both client and future server. Require names
(2–100 characters), valid email, Philippine mobile number, location, position,
and true consent. Experience, employment status, availability, resume, and notes
are optional. Bound every text field. Never trust client validation alone.

Foundation defaults: trim text, lowercase email, normalize accepted `09…`,
`639…`, or `+639…` numbers to `+639…`; allow spaces, parentheses, and hyphens.
Experience is 0–60 numeric years. Resume links use HTTP/HTTPS. Notes and resume
links are limited to 2,000 characters, names to 100, email to 254, phone to 30,
other text and tracking fields to 200. Position/status/availability are free text.

## 9. Google Sheets structure

Use a sheet such as “TaskWavePH Applicants”, worksheet “Applications”. Columns
A–T, in order:

```text
Application ID | Submitted At | First Name | Last Name | Email | Phone
Location | Position | Experience | Employment Status | Availability | Resume
Message | Source | Campaign | UTM Source | UTM Medium | UTM Campaign
Landing Page | Status
```

Default status is `New`. Generate a unique server ID, e.g.
`TW-20261001-A8F3K2`. Never use row numbers as permanent IDs.

## 10. Google integration

Create a Google Cloud project, enable Sheets API, create a service account,
generate credentials, and share the spreadsheet with its email. Isolate writes
in `features/applications/google-sheets.ts`. Keep preparation/business logic in
the application service; the route handles request parsing and boundary validation.

## 11. Environment variables

Document these in `.env.example`:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Turnstile is optional and not required for the foundation. Never commit
`.env.local`, service-account JSON, private keys, or credentials.

## 12. Environment validation

Validate with Zod. Keep Google configuration access server-only and require all
three Google values before operations run. Handle escaped private-key newlines.
Errors must not include secret values. Foundation builds do not require Google
credentials. Add production startup configuration checks with the integration.

## 13. Application API (next feature)

Parse JSON, validate and normalize, generate ID/timestamp, attach bounded tracking,
append the row, and return `{ success: true, applicationId }`. Validation errors
use `{ success: false, error: "INVALID_APPLICATION" }`. Do not expose internal
Google errors. Log useful technical errors without unnecessary applicant data.

## 14. Failure handling

Redirect only after Sheets confirms a write. On failure, preserve the form and
show “We couldn't submit your application right now. Please try again.”
Never show invalid_grant, credential details, or Google API errors to applicants.

## 15. Form UX

Use clear field errors, first-error focus, large touch targets, loading state,
disabled submit while submitting, and accidental double-click protection.
Preserve campaign parameters. The final CTA is “Submit Application”.

Success copy:

> Application received.
>
> Thank you for your interest in TaskWavePH. Our recruitment team will review your
> information and contact you if your profile matches an available opportunity.

Do not promise contact for every applicant.

## 16. Landing page

The eventual landing page includes header, hero/CTA, Why TaskWavePH,
opportunities/roles, application process, about, final CTA, and footer.
Keep the foundation basic. Do not invent vacancies, company statistics, or claims.

## 17. Mobile first

Assume applicants arrive through QR codes, Facebook, Messenger, and mobile
browsers. Check 360, 390, 430, 768, and 1024+ pixels. No horizontal scrolling.

## 18. QR architecture

Preserve source, campaign, utm_source, utm_medium, and utm_campaign as bounded
hidden values. New QR campaigns require only a new URL. For the foundation,
record landing_page as pathname only, avoiding arbitrary query parameters.
Do not put applicant names, emails, phones, or resume links into URLs.

## 19. Spam protection

Baseline: server validation, submission length limits, honeypot, and basic
duplicate-click protection. Add Turnstile and rate limiting later if needed.
Do not introduce complex infrastructure speculatively.

## 20. Privacy

Require unselected consent:

> I agree that TaskWavePH may collect and process the information I provide for
> recruitment and employment-related purposes.

Explain collection purposes on `/privacy`. Foundation privacy copy is a draft;
finalize organization details, privacy contact, retention, and rights procedures
before real applicant collection.

## 21. Security

Keep Google private keys, service credentials, server variables, and future CRM
secrets out of client components and browser bundles. Validate all external input.
Sanitize storage-bound input in the future adapter, including spreadsheet formula
injection protection. Never call Sheets from browser JavaScript.

## 22. Git workflow

Use `main`, feature branches, and pull requests before meaningful merges.
Examples: `feat/application-form`, `feat/google-sheets`, `feat/landing-page`,
`fix/form-validation`. Use conventional commits such as
`feat: add applicant form` or `chore: add environment validation`.

## 23. Initial setup

Scaffold App Router with TypeScript, ESLint, Tailwind, no `src/` folder,
Turbopack, npm, and `@/*`. Initialize shadcn/ui and add button, input, textarea,
select, checkbox, label, card, and alert. Install form, validation, Google API,
and icon packages. Keep lockfile committed.

## 24. Development commands

Provide `npm run dev`, `build`, `start`, `lint`, `typecheck`, `format`,
`format:check`, `test`, and `test:e2e`. A feature is not complete with a failing
production build. Run lint and build before completion.

## 25. Deployment

GitHub → Vercel → taskwaveph.com. Cloudflare manages DNS. Redirect
www.taskwaveph.com to taskwaveph.com. Do not create an app subdomain yet.

## 26. Vercel environment

Set production site URL to `https://taskwaveph.com`. Configure Development,
Preview, and Production independently. Prefer separate development and production
spreadsheets. Never let automated tests write production applicant data.

## 27. Future architecture

Later, Next.js → Convex (jobs/applicants/applications) → integrations
(Sheets/n8n/email). Convex becomes the source of truth and Sheets becomes a
secondary integration. Do not install Convex during the MVP.

## 28. Milestones

1. Repository: framework, tooling, environment structure, README/AGENTS.
2. Landing page: basic sections and mobile layout.
3. Application form: fields, schema, tracking, consent, loading/errors.
4. Sheets: service account, spreadsheet, server API/adapter, confirmed writes.
5. Production: GitHub, Vercel, DNS/domain, production sheet, QR, real submission.

## 29. MVP acceptance criteria

- Domain loads; form works on desktop/mobile; validation and consent are required.
- QR parameters survive; rows reach Sheets; success appears only after save.
- Duplicate clicks are prevented; credentials are never exposed.
- Environments are documented and development/production data are separable.
- Production builds and real QR submissions work.
- Frontend remains compatible with future Convex migration.

## 30. Engineering principles

Keep it simple, server-first for secrets, validate boundaries, mobile-first,
save before automate, and build for migration without speculative abstraction.
No Supabase, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, microservices,
GraphQL, or premature backend complexity in this MVP.

## 31. Instructions for coding agents

1. Read this file before changes; read [DESIGN.md](DESIGN.md) for branding, copy,
   imagery, or UI work. Inspect existing code and reuse patterns.
2. Keep changes scoped; avoid large dependencies without a reason.
3. Do not add Convex unless specifically requested.
4. Keep secrets server-side and Sheets isolated from UI code.
5. Prefer server components; use client components only for interactivity.
6. Use strict TypeScript; avoid `any` unless necessary and documented.
7. Centralize validation; handle loading, success, empty, and error states.
8. Make interfaces responsive; run lint and production build.
9. Test meaningful business logic; avoid unrelated changes.
10. Document each new environment variable; retain future backend compatibility.

## 32. Current project state — foundation and landing page complete

The completed foundation includes home/apply/success routes, draft privacy,
validated form, shared schema, tracking, environment validation, and tests.
The form supports local validation using “Validate Application” and visibly
states that it does not send or save data. Do not fake success or navigate to the
confirmation after local validation. No submission endpoint or Sheets write yet.

The foundation passed lint/type/format/unit/e2e/build checks. Google Sheets
integration remains the next isolated application feature. The foundation and
brand reference have been pushed to GitHub with a draft PR. Google resources,
deployment, DNS, and final production privacy policy are later milestones.

The landing page applies the original logo, Poppins, and the approved white/blue
brand direction. Shared typography and palette also apply to the existing routes.
The page clearly describes applications as opening soon and preserves tracking
in each Apply Now link; it does not enable submission.

## TaskWavePH project and brand instructions

Read this file before making changes. Before branding, copy,
imagery, typography, colors, or UI work, also read [DESIGN.md](DESIGN.md) and inspect
the relevant supplied assets.

- This file defines MVP scope and engineering constraints; DESIGN.md records
  source-backed brand specifications and explicitly labeled design guidance.
- Use the supplied company story, original logo artwork, and official tagline
  "Outsource. Optimize. Grow." Keep original asset proportions and colors.
- Label unsupported claims, missing specifications, and inferred guidance. Do not
  turn mockup contacts, cultural slogans, or service categories into verified
  company facts, employment promises, or current vacancies.
- The initial landing page uses the supplied logo, official palette, and Poppins.
  Retain source-backed branding and the local-validation preview until submission
  integration is implemented.
