import { describe, it, expect } from "vitest";
import {
  campaignLink,
  applicationFiltersSchema,
  applicationMatches,
  campaignReport,
  monthRange,
} from "../../features/applications/campaigns";
import { getTracking } from "../../features/applications/tracking";
import { previewApplicants } from "../../features/applications/preview-data";
describe("recruitment campaign attribution", () => {
  it("builds public role links and preserves the allowlisted tracking fields", () => {
    const url = new URL(
      campaignLink("https://www.taskwaveph.com", "job123", {
        source: "linkedin",
        campaign: "csr-october-2026",
        medium: "social",
      }),
    );
    expect(url.pathname).toBe("/careers/job123");
    expect(getTracking(Object.fromEntries(url.searchParams))).toMatchObject({
      source: "linkedin",
      campaign: "csr-october-2026",
      utm_source: "linkedin",
      utm_medium: "social",
      utm_campaign: "csr-october-2026",
    });
    expect([...url.searchParams.keys()]).toHaveLength(5);
    expect(
      campaignLink(
        "http://localhost:3000",
        "sample-job-1",
        { source: "job-fair", campaign: "dagupan-2026", medium: "qr" },
        true,
      ),
    ).toContain("/dev-preview/careers/sample-job-1?");
  });
  it("rejects unsafe URLs, job paths and invalid campaign codes", () => {
    const values = {
      source: "linkedin" as const,
      campaign: "csr-2026",
      medium: "social" as const,
    };
    expect(() => campaignLink("javascript:alert(1)", "job1", values)).toThrow();
    expect(() =>
      campaignLink("https://user:pass@example.com", "job1", values),
    ).toThrow();
    expect(() =>
      campaignLink("https://example.com", "../apply", values),
    ).toThrow();
    expect(() =>
      campaignLink("https://example.com", "job1", {
        ...values,
        campaign: "Jane Smith@example.com",
      }),
    ).toThrow();
  });
  it("validates Philippine calendar days and inclusive ranges", () => {
    expect(
      applicationFiltersSchema.safeParse({ from: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      applicationFiltersSchema.safeParse({
        from: "2026-10-03",
        to: "2026-10-02",
      }).success,
    ).toBe(false);
    const row = {
      ...previewApplicants()[0],
      submittedAt: Date.parse("2026-10-02T23:59:59+08:00"),
    };
    expect(
      applicationMatches(row, { from: "2026-10-02", to: "2026-10-02" }),
    ).toBe(true);
    expect(
      applicationMatches(
        { ...row, submittedAt: row.submittedAt + 1000 },
        { to: "2026-10-02" },
      ),
    ).toBe(false);
    expect(applicationMatches(row, { source: "not-the-source" })).toBe(false);
  });
  it("counts submissions and current stages without counting clicks or exposing applicants", () => {
    const rows = previewApplicants()
      .slice(0, 3)
      .map((row, i) => ({
        ...row,
        status: i === 0 ? ("Reviewed" as const) : ("Shortlisted" as const),
        data: { ...row.data, source: "linkedin", campaign: "csr-2026" },
      }));
    const result = campaignReport(rows);
    expect(result).toEqual({
      total: 3,
      groups: [
        {
          source: "linkedin",
          campaign: "csr-2026",
          received: 3,
          reviewed: 1,
          shortlisted: 2,
          closed: 0,
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain(rows[0].data.email);
  });
});

it("expands a month into inclusive calendar dates, including leap years", () => {
  expect(monthRange("2026-09")).toEqual({
    from: "2026-09-01",
    to: "2026-09-30",
  });
  expect(monthRange("2028-02")).toEqual({
    from: "2028-02-01",
    to: "2028-02-29",
  });
  expect(() => monthRange("2026-13")).toThrow("INVALID_MONTH");
});

it("does not merge blank attribution with literal display-label campaign codes", () => {
  const first = previewApplicants()[0];
  const result = campaignReport([
    { ...first, data: { ...first.data, source: "", campaign: "" } },
    {
      ...first,
      data: { ...first.data, source: "Unattributed", campaign: "No campaign" },
    },
  ]);
  expect(result.groups).toHaveLength(2);
  expect(result.groups.every((group) => group.received === 1)).toBe(true);
});
it("preserves the actual calendar year for early leap years", () => {
  expect(monthRange("0000-02")).toEqual({
    from: "0000-02-01",
    to: "0000-02-29",
  });
});

it("builds event campaign links without a job and preserves intake attribution", () => {
  const values = {
    source: "job-fair" as const,
    campaign: "com-sayahan-2026",
    medium: "qr" as const,
  };
  const url = new URL(
    campaignLink("https://www.taskwaveph.com", undefined, values),
  );
  expect(url.pathname).toBe("/apply");
  expect(url.searchParams.has("jobId")).toBe(false);
  expect(
    getTracking(Object.fromEntries(url.searchParams), "/apply"),
  ).toMatchObject({
    source: "job-fair",
    campaign: values.campaign,
    utm_medium: "qr",
    landing_page: "/apply",
  });
  expect(
    new URL(campaignLink("http://localhost:3000", undefined, values, true))
      .pathname,
  ).toBe("/dev-preview/job-apply");
});
