# Backup and recovery

## What to preserve

Admin CSV/XLSX exports are useful for recruitment work; they are **not a full
backup**. They exclude attached PDFs and internal associations/security data.
A full Convex snapshot with file storage preserves tables and resumes together.
Keep the matching source commit, deployment name, and configuration inventory
alongside it. Environment secrets and Clerk configuration/users are not supplied
by a Convex snapshot; retain those separately in the owner's password manager.

## Taking a snapshot

Owner default: manual weekly backup and one before significant backend changes.
First confirm the production target in the Convex dashboard is
`fabulous-crane-816`, then use its Export/backup controls and include file storage.
Alternatively, in an authorized terminal:

```bash
npx convex export --prod --include-file-storage --path /ABSOLUTE/SECURE/BACKUP/DIRECTORY/
```

Replace the path with an encrypted, access-controlled location **outside this
repository and public folders**. Review the CLI target before proceeding. This
command reads real personal records and uses bandwidth; it must not run in CI.
Never upload backups into GitHub, website assets, build artifacts, or chat.

Check the export finished and the archive is non-empty. Confirm all expected
application tables and the file-storage payload are present without dumping
personal data into logs. Record snapshot date/deployment/commit privately.
Keep backups under the approved privacy retention/access policy; do not retain
old archives indefinitely. A weekly schedule can lose up to a week's changes;
choose a shorter interval when the business needs a smaller recovery window.

## Recovery rehearsal

1. Obtain owner authorization and use a separate restricted recovery deployment,
   never the production deployment or shared development seeds.
2. Restore the untouched full snapshot through Convex's supported import/restore
   tooling, including storage. Restoring a storage-inclusive snapshot preserves
   storage IDs, so application resume associations can remain intact.
3. Deploy the matching reviewed source and supply isolated secrets/authentication.
   Keep submissions disabled; do not run email/invitation or production smoke jobs.
4. Check record counts, job/application associations, resumes, aggregate metrics,
   schema compatibility, and Owner/Staff restrictions. Use approved owner access
   only; do not expose restored personal information to the public.
5. Record the outcome and remove the recovery copy according to the owner-approved
   data-handling policy once the exercise is complete.

## Production incident

Disable submissions if saves are failing. Investigate logs and the deployed
frontend/backend versions. A frontend rollback must remain compatible with the
backend; code rollback does not restore deleted database rows or PDFs.

Before restoring production, obtain explicit owner approval, preserve the current
state, document the affected time window, and reconcile legitimate records created
since the snapshot. Imports may replace data: do not improvise a production import
command or overwrite the deployment while live writes continue.

After restoration, compare staff approvals/invitations with the current Clerk
accounts and revocations. An old snapshot must not reactivate access deliberately
removed since backup. Verify role restrictions, current published jobs, protected
CV access, metrics and both submission journeys before enabling collection.
Never treat copied auth approvals as a new Owner bootstrap.

References: [Convex snapshot export](https://docs.convex.dev/cli/reference/export),
[backup and restore](https://docs.convex.dev/database/backup-restore),
[storage-inclusive import](https://docs.convex.dev/database/import-export/import).
