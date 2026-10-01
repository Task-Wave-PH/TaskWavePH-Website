import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  createReceipt,
  verifyReceipt,
  RECEIPT_MAX_AGE,
} from "../../features/submissions/receipt";
const secret = "receipt-test-secret-".repeat(4);
const now = Date.UTC(2026, 9, 1);

describe("submission confirmation receipts", () => {
  it("allows refresh during the receipt lifetime and binds the submission kind", () => {
    const receipt = createReceipt("businessLeads", secret, now);
    expect(verifyReceipt(receipt, "businessLeads", secret, now)).toBe(true);
    expect(verifyReceipt(receipt, "businessLeads", secret, now + 1000)).toBe(
      true,
    );
    expect(verifyReceipt(receipt, "applications", secret, now)).toBe(false);
    expect(
      verifyReceipt(
        receipt,
        "businessLeads",
        secret,
        now + RECEIPT_MAX_AGE * 1000,
      ),
    ).toBe(false);
    expect(verifyReceipt(receipt, "businessLeads", secret, now - 1)).toBe(
      false,
    );
  });
  it("rejects missing, malformed, oversized and altered receipts or signing keys", () => {
    const receipt = createReceipt("applications", secret, now);
    const [payload, signature] = receipt.split(".");
    const altered = Buffer.from(
      JSON.stringify({ kind: "businessLeads", expiresAt: now + 86400000 }),
    ).toString("base64url");
    for (const value of [
      undefined,
      "true",
      "bad.signature",
      "x".repeat(1025),
      `${altered}.${signature}`,
      `${payload}.a`,
      `${receipt}.extra`,
    ]) {
      expect(verifyReceipt(value, "applications", secret, now)).toBe(false);
    }
    expect(
      verifyReceipt(receipt, "applications", "different".repeat(8), now),
    ).toBe(false);
    expect(verifyReceipt(receipt, "applications", undefined, now)).toBe(false);
  });
  it("contains no applicant fields or identifiers", () => {
    const receipt = createReceipt("applications", secret, now);
    const payload = JSON.parse(
      Buffer.from(receipt.split(".")[0], "base64url").toString(),
    );
    expect(Object.keys(payload).sort()).toEqual([
      "expiresAt",
      "issuedAt",
      "kind",
      "nonce",
    ]);
  });
});
