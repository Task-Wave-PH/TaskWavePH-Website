import assert from "node:assert/strict";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const url = process.env.CONVEX_SITE_URL;
const headers = {
  Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
  "x-rate-key": "0".repeat(64),
};
async function submit(kind, fields, token, pdf) {
  const body = new FormData();
  body.set("kind", kind);
  body.set("fields", JSON.stringify(fields));
  body.set("submissionToken", token);
  if (pdf)
    body.set(
      "resumeFile",
      new Blob(["%PDF-1.4\n%Synthetic test only\n%%EOF"], {
        type: "application/pdf",
      }),
      "test-resume.pdf",
    );
  const response = await fetch(`${url}/submit`, {
    method: "POST",
    headers,
    body,
  });
  return { status: response.status, data: await response.json() };
}
const token = crypto.randomUUID();
const fields = {
  firstName: "Development",
  lastName: "Test",
  email: "development-test@example.invalid",
  phone: "09171234567",
  location: "Test only",
  position: "Synthetic test record",
  privacyConsent: true,
  message: "Delete this synthetic test after verification.",
};
const first = await submit("applications", fields, token, true);
assert.equal(first.status, 200);
assert.equal(first.data.success, true);
const retry = await submit("applications", fields, token, true);
assert.equal(retry.data.reference, first.data.reference);
const lead = await submit(
  "businessLeads",
  {
    company: "Synthetic development company",
    contactName: "Development Test",
    email: "business-test@example.invalid",
    services: ["Customer Support"],
    message: "Synthetic development enquiry only.",
    privacyConsent: true,
  },
  crypto.randomUUID(),
);
assert.equal(lead.status, 200);
assert.equal(lead.data.success, true);
const denied = await fetch(`${url}/resume?id=unknown`);
assert.equal(denied.status, 403);
console.log(
  "Development smoke passed: application with PDF, idempotent retry, business enquiry, unauthorized download denied.",
);
console.log(
  "Synthetic records were created; delete them after reviewing in the development dashboard.",
);
