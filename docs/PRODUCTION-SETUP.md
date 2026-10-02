# TaskWavePH production setup

## Current state

The application code is on `main` and passed lint, typecheck, formatting, 156
unit/backend tests, the production build, and 39 browser checks. These checks do
not establish that production authentication or submissions work.

On October 2, 2026, setup progressed to:

- Clerk application: `app_3K6WAnlhWMmeeTNkaYJRA5dAR4h` (Task Wave Web app).
- Clerk production instance: `ins_3K84DnUuJ2ramK85SeO1XRV4lxb`.
- Clerk CLI verified domain DNS, SSL, email, and the Google connection as complete.
- The owner approved the current Website Terms for publication on October 2, 2026.
- Convex production dashboard: https://dashboard.convex.dev/d/fabulous-crane-816.
- Convex production backend deployment: reported successful by the owner after
  correcting the Clerk issuer URL; authenticated production behavior is not yet verified.
- Convex Deployment URL: `https://fabulous-crane-816.ap-southeast-2.convex.cloud`.
- Convex HTTP Actions URL: `https://fabulous-crane-816.ap-southeast-2.convex.site`.
- Public origin: `https://www.taskwaveph.com`.
- Staff origin: `https://admin.taskwaveph.com`.

Keep local development credentials unchanged. Do not copy development users,
approvals, applicant records, or seeds into production.

## 1. Clerk production

For initial setup or to resume it, run `clerk deploy` in a human terminal. Use the linked
application above and the application domain `admin.taskwaveph.com`. The CLI
requires interactive production setup; `clerk deploy status` is read-only and
can verify progress afterward.

Add only the exact verification records Clerk supplies in Cloudflare. Preserve
existing website and email records. Do not invent DNS targets. Complete domain,
TLS, and email verification. Configure email/password and recovery, restricted
(invite-only) signup, and the production JWT template named `convex` using Clerk's
Convex integration. Production keys must belong to this production instance.

## 2. Environment settings

Copy the production Deployment URL and HTTP Actions URL from the Convex dashboard;
do not infer a regional hostname from the deployment name. Generate a new random
production shared secret of at least 32 characters. It is distinct from any
Convex deploy key and must match on Vercel and Convex.

### Vercel: Production environment only

| Variable                                          | Value                                 |
| ------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                            | `https://www.taskwaveph.com`          |
| `NEXT_PUBLIC_ADMIN_URL`                           | `https://admin.taskwaveph.com`        |
| `NEXT_PUBLIC_CONVEX_URL`                          | Production Deployment URL (`.cloud`)  |
| `CONVEX_SITE_URL`                                 | Production HTTP Actions URL (`.site`) |
| `CONVEX_SERVER_SECRET`                            | New production shared secret          |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | Production Clerk publishable key      |
| `CLERK_SECRET_KEY`                                | Production Clerk secret key           |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | `/admin/sign-in`                      |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | `/admin/sign-up`                      |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/admin`                              |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/admin`                              |
| `SUBMISSIONS_ENABLED`                             | `false` during setup                  |
| `PRIVACY_POLICY_APPROVED`                         | `false` until owner approval          |

Both domains must belong to the same Vercel project. Public variables are compiled
into the browser bundle; redeploy after changing them. Secret variables have no
`NEXT_PUBLIC_` prefix. Preview and Development must not inherit production keys.

### Convex: production deployment environment only

| Variable                        | Value                                               |
| ------------------------------- | --------------------------------------------------- |
| `CONVEX_SERVER_SECRET`          | Same production shared secret as Vercel             |
| `CLERK_JWT_ISSUER_DOMAIN`       | Production Clerk issuer from the Convex integration |
| `CLERK_SECRET_KEY`              | Same production Clerk secret key as Vercel          |
| `STAFF_INVITATION_REDIRECT_URL` | `https://admin.taskwaveph.com/sign-up`              |
| `ALLOW_DEVELOPMENT_SEED`        | `false`                                             |

`CLERK_JWT_ISSUER_DOMAIN` must contain the **Issuer URL**, not the JWT template ID
(`jtmp_...`) or the JWKS endpoint. The production JWT template must be named
`convex`. Confirm the issuer in Clerk before deploying; an invalid URL prevents
Convex deployment.

Enter credentials directly in dashboards. Do not paste keys into chat, print
environment files, or commit credentials. `npm run convex:configure` is for
development only and must not be used to configure production.

## 3. Manual deployment and Owner bootstrap

Keep the initial deployment manual. First verify that the CLI's production target
is `fabulous-crane-816`, configure the Convex environment above, and deploy the
reviewed backend with `npx convex deploy`. Review its selected deployment before
confirming. Do not use a development smoke/seed command against production.

The matching backend must exist before redeploying Vercel; the website's export
route requires `exports:begin`, and the resume handler requires its internal
permit mutation. Redeploy the website with the production-only variables above.

Initialize exact dashboard counts on the confirmed production deployment:

```bash
npx convex run --prod overview:startBackfill '{}'
```

Establish the first Owner account through trusted Clerk provisioning. Verify its
production user ID and verified email; then use the existing internal provisioning
function on production, replacing both placeholders:

```bash
npx convex run --prod provision:setStaff '{"subject":"user_REPLACE_ME","active":true,"role":"Owner","email":"REPLACE_WITH_VERIFIED_EMAIL"}'
```

Clerk login alone does not authorize staff. Development Owner approval does not
carry over. Do not open unrestricted signup to bootstrap an Owner.

## 4. Acceptance checks and collection activation

- On the admin domain, signed-out requests reach sign-in. The verified Owner can
  reach the dashboard and Users. Unapproved accounts see access denied.
- Invite a second email controlled by the owner and verify registration, approval,
  and Staff access. Staff cannot access Users or its backend operations. Verify
  deactivation removes access and the last Owner cannot be removed.
- Public and Vercel preview hosts reject administrative pages, private APIs, and
  Clerk auto-proxy. Check login, logout, recovery, and private/no-store headers.
- Set real `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on Vercel
  Production; authorize the public hostname. Never use test keys in production.
- Supply owner-approved `PRIVACY_ORGANIZATION`, `PRIVACY_CONTACT_EMAIL`, and
  `PRIVACY_RETENTION_NOTICE`, review Privacy and Terms, then set
  `PRIVACY_POLICY_APPROVED=true` and `SUBMISSIONS_ENABLED=true` and redeploy.
- Submit clearly labeled test application/enquiry records using an email the
  owner controls. Verify persistence, selected Published job association, optional
  PDF view/download, exports, status updates, failed submission behavior, receipt
  guards, and safe 429 retry responses. Remove only those owned test records.

If verification fails, keep or restore `SUBMISSIONS_ENABLED=false`. Do not revert
the backend to an incompatible version while the website relies on its functions.
Monitor Convex storage/bandwidth, database I/O, and function usage along with Clerk
and hosting usage dashboards. No paid upgrade is part of this setup.

References: [Clerk production deployment](https://clerk.com/docs/guides/development/deployment/production),
[Convex with Vercel](https://docs.convex.dev/production/hosting/vercel).
