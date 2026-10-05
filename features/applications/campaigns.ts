import { applicantSearchMatches, searchWords, isEmailSearch } from "./search";
import { z } from "zod";
import { getTrackedHref } from "./tracking";
import type { Doc } from "../../convex/_generated/dataModel";

export const campaignChannels = [
  "linkedin",
  "facebook",
  "instagram",
  "job-fair",
  "office-qr",
  "other",
] as const;
export const campaignSchema = z.object({
  source: z.enum(campaignChannels),
  campaign: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens.",
    ),
  medium: z.enum(["social", "paid-social", "qr", "referral"]),
});
export function campaignLink(
  origin: string,
  jobId: string | undefined,
  values: z.infer<typeof campaignSchema>,
  preview = false,
) {
  const parsed = campaignSchema.parse(values);
  const base = new URL(origin);
  if (!/^https?:$/.test(base.protocol) || base.username || base.password)
    throw new Error("INVALID_SITE_URL");
  if (jobId !== undefined && !/^[a-zA-Z0-9_-]{1,100}$/.test(jobId))
    throw new Error("INVALID_JOB_ID");
  return new URL(
    getTrackedHref(
      jobId !== undefined
        ? `${preview ? "/dev-preview" : ""}/careers/${encodeURIComponent(jobId)}`
        : preview
          ? "/dev-preview/job-apply"
          : "/apply",
      {
        source: parsed.source,
        campaign: parsed.campaign,
        utm_source: parsed.source,
        utm_medium: parsed.medium,
        utm_campaign: parsed.campaign,
      },
    ),
    base.origin,
  ).href;
}
const optionalText = z.string().trim().max(200).optional();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00+08:00`);
    return (
      Number.isFinite(parsed.getTime()) &&
      new Date(parsed.getTime() + 8 * 3600000).toISOString().slice(0, 10) ===
        value
    );
  }, "Choose a valid date.")
  .optional();
export const applicationFiltersSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(254)
      .refine(
        (value) =>
          !value ||
          isEmailSearch(value) ||
          (searchWords(value).length > 0 &&
            searchWords(value).length <= 16 &&
            searchWords(value).every((term) => term.length <= 32)),
        "Use up to 16 search words of 32 characters each.",
      )
      .optional(),
    source: optionalText,
    campaign: optionalText,
    jobId: z
      .string()
      .max(100)
      .regex(/^[a-zA-Z0-9_-]*$/)
      .optional(),
    from: date,
    to: date,
  })
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "The end date must be on or after the start date.",
  );
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;
export function applicationMatches(
  row: Pick<Doc<"applications">, "data" | "submittedAt" | "reference">,
  filters: ApplicationFilters,
) {
  return (
    (!filters.search || applicantSearchMatches(row, filters.search)) &&
    (!filters.source || row.data.source === filters.source) &&
    (!filters.campaign || row.data.campaign === filters.campaign) &&
    (!filters.jobId || row.data.jobId === filters.jobId) &&
    (!filters.from ||
      row.submittedAt >= Date.parse(`${filters.from}T00:00:00+08:00`)) &&
    (!filters.to ||
      row.submittedAt < Date.parse(`${filters.to}T00:00:00+08:00`) + 86400000)
  );
}
export function filterParams(filters: ApplicationFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => !!value),
  );
}
export function campaignReport(
  rows: Pick<Doc<"applications">, "data" | "status">[],
) {
  const groups = new Map<
    string,
    {
      source: string;
      campaign: string;
      received: number;
      reviewed: number;
      shortlisted: number;
      closed: number;
    }
  >();
  for (const row of rows) {
    const source = row.data.source || "Unattributed",
      campaign = row.data.campaign || "No campaign";
    const key = JSON.stringify([row.data.source, row.data.campaign]);
    const group = groups.get(key) ?? {
      source,
      campaign,
      received: 0,
      reviewed: 0,
      shortlisted: 0,
      closed: 0,
    };
    group.received++;
    if (row.status === "Reviewed") group.reviewed++;
    if (row.status === "Shortlisted") group.shortlisted++;
    if (row.status === "Closed") group.closed++;
    groups.set(key, group);
  }
  return {
    total: rows.length,
    groups: [...groups.values()].sort(
      (a, b) =>
        b.received - a.received ||
        a.source.localeCompare(b.source) ||
        a.campaign.localeCompare(b.campaign),
    ),
  };
}
export type CampaignReport = ReturnType<typeof campaignReport>;

export function monthRange(month: string): { from: string; to: string } {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("INVALID_MONTH");
  const from = `${month}-01`;
  if (!applicationFiltersSchema.safeParse({ from }).success)
    throw new Error("INVALID_MONTH");
  const end = new Date(`${from}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const days = end.getUTCDate();
  return { from, to: `${month}-${String(days).padStart(2, "0")}` };
}
