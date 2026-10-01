import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type SubmissionKind = "applications" | "businessLeads";
export const RECEIPT_MAX_AGE = 10 * 60;
export const confirmationRoutes = {
  applications: {
    cookie: "tw-application-receipt",
    success: "/apply/success",
    form: "/apply",
  },
  businessLeads: {
    cookie: "tw-enquiry-receipt",
    success: "/business-enquiry/success",
    form: "/business-enquiry",
  },
} as const;

const receiptSchema = z.strictObject({
  kind: z.enum(["applications", "businessLeads"]),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().nonnegative(),
  nonce: z.uuid(),
});
function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`taskwaveph:submission-receipt:v1:${payload}`)
    .digest();
}

export function createReceipt(
  kind: SubmissionKind,
  secret: string,
  now = Date.now(),
) {
  if (secret.length < 32)
    throw new Error("Receipt configuration is incomplete.");
  const payload = Buffer.from(
    JSON.stringify({
      kind,
      issuedAt: now,
      expiresAt: now + RECEIPT_MAX_AGE * 1000,
      nonce: randomUUID(),
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function verifyReceipt(
  value: string | undefined,
  kind: SubmissionKind,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!value || value.length > 1024 || !secret || secret.length < 32)
    return false;
  const parts = value.split(".");
  if (
    parts.length !== 2 ||
    parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
  )
    return false;
  try {
    const [payload, encodedSignature] = parts;
    const actual = Buffer.from(encodedSignature, "base64url");
    const expected = signature(payload, secret);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return false;
    const receipt = receiptSchema.safeParse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    return (
      receipt.success &&
      receipt.data.kind === kind &&
      receipt.data.issuedAt <= now &&
      receipt.data.expiresAt > now &&
      receipt.data.expiresAt - receipt.data.issuedAt === RECEIPT_MAX_AGE * 1000
    );
  } catch {
    return false;
  }
}
