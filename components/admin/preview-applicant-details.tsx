"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplicantDetails } from "./applicant-details";
import { usePreviewApplicants } from "./preview-provider";
export function PreviewApplicantDetails({ id }: { id: string }) {
  const { records, update, remove } = usePreviewApplicants();
  const router = useRouter();
  const record = records.find((r) => r._id === id);
  if (!record)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Applicant not found</h1>
        <Link
          className="text-primary underline"
          href="/dev-preview/applications"
        >
          Back to applications
        </Link>
      </div>
    );
  return (
    <>
      <p className="rounded-lg border bg-secondary p-4 text-sm">
        Sample applicant · Changes last until the page is reloaded.
      </p>
      <ApplicantDetails
        key={record._id}
        record={record}
        backHref="/dev-preview/applications"
        resumeUrl={record.resumeFile ? "/dev-preview/sample-cv" : undefined}
        onSave={async (status, notes) => update(id, status, notes)}
        onDelete={async () => {
          remove(id);
          router.push("/dev-preview/applications");
        }}
      />
    </>
  );
}
