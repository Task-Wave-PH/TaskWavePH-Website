# Local security and performance audit

Reviewed October 2, 2026 (Asia/Manila).

## Result and scope

**GOOD for the tested local scope:** confirmed findings below are fixed and the
required local checks pass. This is a source review and bounded adversarial test,
not an independent penetration-test certification or a production security sign-off.

Reviewed public pages, staff/Owner authorization, host routing, Clerk invitation
logic, Convex CRUD/storage functions, submissions, exports, environment handling,
cache policies, receipt expiry, cleanup, and dependency advisories. Existing
uncommitted user work was preserved. No external records, invitations, DNS,
deployments, or production configuration were changed.

## Confirmed findings and fixes

| Finding                                                | Severity                  | Evidence and fix                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stalled export fetch could exceed the nominal deadline | Medium: availability      | Deadline checks occurred between queries, with no abort signal on the query itself. A stalled-fetch regression reproduced the missing signal. Convex export queries and audit writes now share a 25-second abort budget and caller-disconnect signal, with no-store fetches and timer cleanup. |
| Cross-origin submissions reached backend work          | Low: defense in depth     | Foreign/opaque Origins and cross-site Fetch Metadata were ignored. Regression requests now return 403 `INVALID_ORIGIN` before consuming backend/challenge resources. Turnstile and validation remain required; this is not evidence that CAPTCHA was bypassed.                                 |
| Direct CV error responses lacked private cache policy  | Low                       | Anonymous and invalid-mode Convex HTTP responses lacked no-store headers. Both now carry private/no-store, noindex, and nosniff, alongside successful responses.                                                                                                                               |
| Reservation accepted at its exact expiry               | Low: boundary correctness | Save used `<` rather than `<=`. Frozen-clock regression now rejects at exactly one hour; cleanup includes that same boundary.                                                                                                                                                                  |
| Public cache eligibility did not exclude cookies       | Low: defensive invariant  | The helper excluded Authorization but accepted Cookie and explicit credential inclusion despite its documented boundary. Both now bypass caching. Current public projections exposed no private record in this audit.                                                                          |

No high or critical finding was confirmed in this local review. Runtime parsing,
permissions, CAPTCHA, rate limits, and test expectations were not relaxed.

## Security evidence

- Convex tests exercise anonymous, signed-in/unapproved, approved, revoked, Staff,
  and Owner access; stale writes; last-Owner protection; invitation replay,
  cancellation, expiry, trusted email/metadata; and linked resume deletion.
  Identities are fixtures, not proof of deployed Clerk JWT verification.
- HTTP probes use forged sessions/authorization, proxy-bypass headers, forwarded
  admin hosts, encoded paths, and forged receipt cookies. Admin responses remain
  denied on the public production host. Confirmation requests redirect to forms.
- Submission tests cover consent, honeypots, invalid challenge host/action,
  malformed bodies, disguised/oversized PDFs, bounded stream timeouts, throttling,
  idempotency, and persistence failures without confirmation receipts.
- Browser tests exercise inert script tracking input, allowlisted navigation,
  framing/MIME security headers, private response headers, mobile widths,
  keyboard navigation, and disabled collection.
- CSV tests neutralize formula prefixes and quote multiline cells; XLSX values
  remain text. Exported records omit storage IDs and fingerprints.
- `npm audit --json`: zero known advisories across the installed dependency tree.
  A pattern scan of source and built static chunks found no Clerk secret-key or
  PEM private-key patterns. Neither check proves absence of unknown vulnerabilities.

## Latency baseline

Measured October 2, 2026 at approximately 03:55 Manila time. Apple M4, arm64 macOS,
Node 22.20.0, Next.js 16.3.8 production build, loopback HTTP. Fresh build directory
and fresh server process; backend replaced with a loopback-only synthetic fixture.
Collection and Clerk were disabled. Response timings include reading the complete
HTTP body, but exclude browser rendering, image downloads, and real service latency.

Each route has 60 samples at concurrency 1, 5, and 10: **1,260 requests with zero
unexpected responses**. Expected 404/503 denials count as successful checks. The
home first request is the cold-process observation; other first requests occur
after shared runtime initialization. Short samples give only a coarse p99 estimate.

| Route                   | First response ms | Warm p95 ms at 1 / 5 / 10 concurrent | Warm p50 / p99 ms at 10 | Requests/sec at 10 |
| ----------------------- | ----------------: | ------------------------------------ | ----------------------- | -----------------: |
| Home                    |            107.81 | 9.70 / 17.71 / 53.27                 | 29.26 / 55.14           |             304.26 |
| Services                |              8.96 | 5.89 / 17.86 / 30.48                 | 29.71 / 30.75           |             339.67 |
| Careers with fixture    |             43.48 | 5.80 / 17.80 / 27.03                 | 25.43 / 27.14           |             389.53 |
| Apply                   |             12.52 | 4.41 / 12.87 / 24.24                 | 22.18 / 35.26           |             447.06 |
| Denied admin page       |             14.16 | 7.38 / 12.28 / 33.12                 | 21.81 / 40.75           |             423.75 |
| Denied export API       |              1.38 | 0.53 / 2.02 / 3.69                   | 1.82 / 5.39             |           4,139.49 |
| Disabled submission API |             18.02 | 1.45 / 4.02 / 8.49                   | 4.15 / 9.57             |           2,004.65 |

These are local observations, not production capacity guarantees or authenticated
dashboard/save benchmarks. No additional infrastructure was justified by this run.
Raw measurements are in `output/security-audit/results.json` (ignored artifact).

## Cache, expiry, and timeout checks

| Control                                     | Configured behavior                                                    | Verification                                                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public job first page                       | 60-second revalidation; bounded filters/pages only                     | Real elapsed-time fixture check retained the initial list, returned changed details immediately, and refreshed the list after 61 seconds. Time-based revalidation may serve one stale response while refreshing. |
| Job detail / subsequent pages / credentials | No-store fetches                                                       | Unit cache-boundary tests and immediate detail freshness check.                                                                                                                                                  |
| Admin, export, CV, confirmation             | Private/no-store; noindex                                              | Production HTTP checks plus direct Convex error-response tests.                                                                                                                                                  |
| Confirmation receipt                        | 600 seconds; HttpOnly, scoped path, SameSite=Lax; Secure in production | Rejects exact expiry, future issuance, tampering, wrong kind/key, and oversized values; successful-save cookie assertions.                                                                                       |
| Staff invitation                            | Seven days                                                             | Frozen-clock test checks the actual configured lifetime and denies exact-expiry acceptance.                                                                                                                      |
| Pending upload                              | One-hour reservation; cleanup every 15 minutes                         | Exact-expiry rejection/deletion, attached-file preservation, and deletion tests. Expiry is eligibility, not an exact physical deletion guarantee.                                                                |
| Orphan upload                               | Older than one hour; hourly paginated cleanup                          | Source review: bounded pages, linked/pending lookup before deletion. Physical cleanup can lag by the schedule and backlog.                                                                                       |
| Attempt limits                              | 20/address/10 minutes; 120 global/minute                               | Local persistent limiter tests, shared budget, denial commits, positive Retry-After, and cooldown recovery.                                                                                                      |
| Save limits                                 | 5/address/hour; 30 global/minute                                       | Isolated persistent limiter tests. Fixed windows allow bursts around boundaries.                                                                                                                                 |
| Body / attempt / challenge / save           | 30s / 5s / 10s / 30s                                                   | Cancellation tests for body streams; source inspection of transport signals.                                                                                                                                     |
| Job / CV / Clerk / export network           | 10s / 15s / 15s / 25s                                                  | Source inspection; stalled export-fetch regression.                                                                                                                                                              |
| Browser submission                          | 90 seconds                                                             | Source inspection: timeout keeps data and idempotency identity for retry.                                                                                                                                        |
| Cookie notice                               | 180 days                                                               | Cookie serialization and browser persistence/reopen tests. This is acknowledgment, not advertising consent.                                                                                                      |

## Verification and reproduction

### Follow-up review

The review-fix-loop found one further issue in the audit tooling: checking that
the app used local fixtures only after the benchmark could load a localhost app
connected to a real service. Before generating load, the harness now requires a
unique current-fixture session marker in an uncached role-detail response and
confirms that the fixture received the query. Mismatches stop the run. Fixture
stats/control requests now have five-second timeouts and reject redirects.
Preflight performs one detail probe; use the documented isolated build so even
that probe cannot contact a live backend. `--preflight-only` checks the binding
without load or fixture mutation.

Regression checks cover refusing an unrelated backend, accepting a bound fixture,
export caller-disconnect cancellation, and timer cleanup. The generated audit
build directory is now explicitly excluded from ESLint and Prettier, matching
the existing generated-build policy. A lint rerun had incorrectly scanned those
generated bundles; application source remains checked.
Subsequent benchmark
runs perform this preflight before timing routes, so their first route response
is **not** a cold-process measurement. The historical table above predates this
preflight and is retained as the original baseline.

Follow-up verification: **143 unit/backend tests in 17 files**, fixture-binding
smoke check, lint, typecheck, formatting, production build, and **29 production
browser tests**. No backend deployment or live authentication check was performed.

Passed: lint, strict typecheck, formatting, **140 unit/backend tests in 16 files**,
**29 production browser tests**, production builds, and diff whitespace checks.
The first browser run against populated fixtures correctly failed an existing
empty-careers expectation; the unchanged suite passed against an empty-backend
build. Generated TypeScript configuration drift from the audit build was restored.

For another isolated latency/TTL run, start the fixture server in one terminal:

```bash
node scripts/audit-local.mjs --fixtures
```

Use a fresh ignored `.next-security-audit` build directory (an existing cache can
invalidate a cold baseline). Build and start in another terminal:

```bash
NEXT_BUILD_DIR=.next-security-audit NEXT_BUILD_CACHE=false NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3217 CONVEX_SITE_URL=http://127.0.0.1:3217 SUBMISSIONS_ENABLED=false NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= CLERK_SECRET_KEY= NEXT_PUBLIC_ADMIN_URL=https://admin.taskwaveph.test npm run build
NEXT_BUILD_DIR=.next-security-audit NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3217 CONVEX_SITE_URL=http://127.0.0.1:3217 SUBMISSIONS_ENABLED=false NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= CLERK_SECRET_KEY= NEXT_PUBLIC_ADMIN_URL=https://admin.taskwaveph.test npm run start -- --hostname 127.0.0.1 --port 3106
```

Then run `AUDIT_BASE_URL=http://127.0.0.1:3106 node scripts/audit-local.mjs`.
The script rejects non-loopback targets and verifies the fixture binding before
load. It changes only the in-memory fixture's
generation, waits for the TTL, and writes its ignored result artifact. Stop these
temporary processes after verification. Next may add the custom build types to
tsconfig; preserve existing configuration and remove only audit-generated drift.

## Remaining verification and practical limits

- Backend fixes have not been deployed. Separate approval is needed for a
  development deploy and real invitation/authenticated CRUD/CV smoke checks.
  Production Clerk, Convex, Turnstile, HTTPS, DNS, CDN headers, and edge latency
  were not verified by this local audit.
- The existing CSP restricts framing, objects, and base URLs but has no strict
  script allowlist. A nonce-based policy needs testing with actual Clerk,
  Turnstile, Next.js, and PDF workers before production enforcement.
- PDF signature/type checking is not antivirus scanning; credentials and access
  controls do not establish that a submitted PDF is harmless.
- Origin checks are browser defense in depth. Non-browser clients can forge or
  omit headers; server validation, CAPTCHA, and persistent throttling remain the
  controls for those clients. Vercel injects the IP header used for bucketing;
  self-hosted requests deliberately share an unknown-address bucket.
- Transport cancellation cannot preempt synchronous workbook CPU work or cancel
  an external write that already committed. Confirmed persistence and idempotent
  retries remain necessary.
- No destructive scans, saturation tests, external load tests, full accessibility
  certification, or ASVS certification were performed. Prior uncommitted work
  remains; no commit, push, or merge was made.

Review references: [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html),
[OWASP origin/Fetch Metadata guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
[Vercel request-header behavior](https://vercel.com/docs/headers/request-headers).
Next.js cache behavior was also checked against the installed framework docs.

## October 2 follow-up: security and free-tier resource use

Added persistent Convex budgets to expensive protected HTTP operations, with
authorization before throttling and private 429/Retry-After responses:

| Operation              | Per approved staff account | Deployment total   |
| ---------------------- | -------------------------- | ------------------ |
| CSV / XLSX export      | 5 per ten minutes          | 20 per ten minutes |
| Resume view / download | 30 per minute              | 120 per minute     |

Export denials stop before record pagination and workbook generation. Resume
denials stop before storage access and do not create successful-view audit entries.
The resume proxy cancels upstream work when the browser disconnects, preserves
safe retry timing, and retains its 15-second transport deadline. Export transport
retains its 25-second deadline. Neither can undo committed operations; synchronous
workbook generation cannot be interrupted by abort signals. Endpoint budgets do
not limit every direct authenticated Convex query.

Verification passed: lint, typecheck, formatting, **156 unit/backend tests in 20
files**, isolated production builds, **29 production browser tests**, and **10
localhost preview/access browser tests**. Dependency audit reported **zero
production dependency vulnerabilities**. Backend tests used convex-test, not
cloud writes. One read-only public jobs query succeeded against the configured
development deployment (zero published rows). No invitations, private record
reads, cloud writes, migrations, or deployments were performed. Actual signed-in
Owner/Staff verification, deployed limits, production edge behavior, account
quotas, and service billing settings remain unverified.

The isolated loopback load run used twenty samples for each route/concurrency
pair, at concurrency one and five, with fewer than 500 total requests. There were
zero benchmark errors. At concurrency five:

| Route / outcome       | p95 milliseconds |
| --------------------- | ---------------: |
| Home                  |            27.24 |
| Services              |            17.90 |
| Careers               |            16.01 |
| Apply                 |            19.01 |
| Denied administration |            16.47 |
| Denied export         |             2.09 |
| Disabled submission   |             4.24 |

These measurements use an Apple M4 and synthetic local fixtures after an isolation
preflight, not cold starts or production network latency. The bounded published
first-page cache retained its initial data, refreshed after the 60-second TTL
(checked after 61 seconds), and job details reflected fixture updates immediately.
Protected responses remained private/no-store. Direct confirmation access returned
to the corresponding form. Tracking injection stayed inert. The ignored artifact
is `output/security-audit/results.json`; the existing fixture script reproduces it.

### Cost and quota considerations

- Monitor Convex database storage/I/O, file storage/bandwidth, function calls, and
  action compute in the deployment dashboard. Scheduled cleanup, subscriptions,
  exports, and CV reads contribute usage. Free-plan quotas are hard limits;
  throttling reduces abuse but cannot guarantee uninterrupted free service.
  See [Convex limits](https://docs.convex.dev/production/state/limits).
- Hourly orphan cleanup paginates storage in batches of 100 and checks application
  and pending-upload indexes for older files. Its reads grow with total stored CVs.
  Preserve the one-hour orphan policy and monitor this path as storage grows;
  do not lengthen cleanup intervals or delete linked resumes to reduce usage.
- Public job queries are readable directly from Convex. The Next.js 60-second
  cache reduces website traffic to that backend, but cannot prevent direct reads.
  Private authorization and current-job eligibility checks remain uncached.
- Confirm Clerk and Turnstile usage/configuration in their account dashboards;
  public pricing does not establish this project's active plan or remaining quota.
  See [Clerk pricing](https://clerk.com/pricing) and
  [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).
- Vercel Hobby is limited to personal, non-commercial use. TaskWavePH is a business
  website, so do not assume Hobby covers its production deployment; the owner
  should select suitable hosting terms. See
  [Vercel Hobby](https://vercel.com/docs/plans/hobby).

No new dependencies, environment variables, paid infrastructure, or datastore
were introduced. Deploy the reviewed Convex functions before the matching Next.js
routes because they now depend on the new budget mutation. Deployment remains a
separate authorized step.
