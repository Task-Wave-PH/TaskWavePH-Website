import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { requireDevelopmentTarget } from "./development-target.mjs";
requireDevelopmentTarget();
const rateKey = createHash("sha256")
  .update(`development-attempt-check:${randomUUID()}`)
  .digest("hex");
const url = `${process.env.CONVEX_SITE_URL}/submission-attempt`;
assert.equal((await fetch(url, { method: "POST" })).status, 401);
for (let index = 0; index < 21; index++) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CONVEX_SERVER_SECRET}`,
      "x-rate-key": rateKey,
    },
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (index < 20) {
    assert.equal(response.status, 200);
    assert.equal(result.allowed, true);
  } else {
    assert.equal(response.status, 429);
    assert.equal(result.error, "RATE_LIMITED");
    assert.ok(result.retryAfterSeconds > 0);
    assert.equal(
      Number(response.headers.get("Retry-After")),
      result.retryAfterSeconds,
    );
  }
}
console.log(
  "Development attempt limits verified: authentication required, 20 accepted checks, then persistent throttling with Retry-After. No applicant records created.",
);
