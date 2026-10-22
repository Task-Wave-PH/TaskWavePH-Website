import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const subject = `user_job_format_${randomUUID()}`;
const identity = JSON.stringify({
  subject,
  issuer: "https://clerk-development-not-configured.invalid",
});
function run(name, args, authenticated = false) {
  const result = spawnSync(
    "npx",
    [
      "convex",
      "run",
      name,
      JSON.stringify(args),
      ...(authenticated ? ["--identity", identity] : []),
    ],
    { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0)
    throw new Error(`Development formatting verification failed at ${name}.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
const data = {
  title: `Synthetic URL Check ${randomUUID()}`,
  serviceArea: "Customer Support",
  location: "Synthetic test only",
  arrangement: "Remote",
  employmentType: "Contract",
  description: "Synthetic development verification, not an actual vacancy.",
  responsibilities: "Synthetic verification responsibilities.",
  requirements: "Synthetic verification requirements.",
  salary: "",
};
const paragraph = (text) => ({
  type: "paragraph",
  content: [
    { type: "text", text, marks: [{ type: "bold" }, { type: "italic" }] },
  ],
});
const richText = {
  description: {
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: [{ type: "listItem", content: [paragraph(data.description)] }],
      },
    ],
  },
};
let id;
let provisioned = false;
try {
  run("provision:setStaff", { subject, active: true });
  provisioned = true;
  id = run("jobs:save", { data: { ...data, richText } }, true);
  let saved = run("jobs:staffDetail", { id }, true);
  assert.deepEqual(saved.richText, richText);
  run(
    "jobs:save",
    {
      id,
      data: { ...data, title: "Synthetic metadata edit" },
      expectedUpdatedAt: saved.updatedAt,
    },
    true,
  );
  saved = run("jobs:staffDetail", { id }, true);
  assert.deepEqual(saved.richText, richText);
  assert.throws(() =>
    run(
      "jobs:save",
      {
        id,
        data: {
          ...data,
          description: "An older client attempted to replace this body.",
        },
        expectedUpdatedAt: saved.updatedAt,
      },
      true,
    ),
  );
  const updatedRich = {
    description: {
      type: "doc",
      content: [
        paragraph("Updated synthetic development description content."),
      ],
    },
  };
  run(
    "jobs:save",
    {
      id,
      data: { ...data, richText: updatedRich },
      expectedUpdatedAt: saved.updatedAt,
    },
    true,
  );
  run("jobs:setStatus", { id, status: "Published" }, true);
  const published = run("jobs:detail", { id });
  assert.deepEqual(published.richText, updatedRich);
  assert.equal(
    published.description,
    "Updated synthetic development description content.",
  );
  console.log(
    "Development formatted job writes, plain-text derivation, legacy metadata preservation, and public reads passed.",
  );
} finally {
  if (id) run("jobs:remove", { id }, true);
  if (provisioned) run("provision:setStaff", { subject, active: false });
  console.log(
    "Synthetic job deleted; temporary staff deactivated. Audit metadata retained.",
  );
}
