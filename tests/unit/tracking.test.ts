import { describe, expect, it } from "vitest";
import { getApplyHref, getTracking } from "@/features/applications/tracking";

describe("campaign tracking", () => {
  it("keeps only allowlisted fields and pathname", () => {
    expect(
      getTracking({
        source: "cite",
        campaign: "fair",
        utm_source: "qr",
        email: "private",
        phone: "private",
      }),
    ).toEqual({
      source: "cite",
      campaign: "fair",
      utm_source: "qr",
      utm_medium: "",
      utm_campaign: "",
      landing_page: "/apply",
    });
  });
  it("trims and bounds parameters, using first repeated value", () => {
    expect(
      getTracking({ source: [" first ", "second"], campaign: "x".repeat(201) })
        .source,
    ).toBe("first");
    expect(getTracking({ campaign: "x".repeat(201) }).campaign).toHaveLength(
      200,
    );
  });
  it("encodes tracking in CTA and excludes personal query parameters", () => {
    expect(
      getApplyHref({
        source: "job fair",
        campaign: "oct&2026",
        email: "private",
      }),
    ).toBe("/apply?source=job+fair&campaign=oct%262026");
    expect(getApplyHref({})).toBe("/apply");
  });
});
