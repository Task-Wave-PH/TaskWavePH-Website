import { isEmailSearch } from "../features/applications/search";
import { v, ConvexError } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { PaginationOptions } from "convex/server";
import {
  applicationFiltersSchema,
  applicationMatches,
  type ApplicationFilters,
} from "../features/applications/campaigns";
import type { Doc } from "./_generated/dataModel";

export const applicationFilters = v.object({
  search: v.optional(v.string()),
  source: v.optional(v.string()),
  campaign: v.optional(v.string()),
  jobId: v.optional(v.string()),
  from: v.optional(v.string()),
  to: v.optional(v.string()),
});
// Narrow by an indexed dimension and date range before applying optional combinations.
// Filter the bounded page, preserving the underlying cursor even for an empty page.
export async function filteredApplications(
  ctx: QueryCtx,
  status: Doc<"applications">["status"] | undefined,
  raw: ApplicationFilters | undefined,
  paginationOpts: PaginationOptions,
) {
  const parsed = applicationFiltersSchema.safeParse(raw ?? {});
  if (!parsed.success) throw new ConvexError("INVALID_FILTERS");
  const filters = parsed.data;
  const start = filters.from ? Date.parse(`${filters.from}T00:00:00+08:00`) : 0;
  const end = filters.to
    ? Date.parse(`${filters.to}T00:00:00+08:00`) + 86400000
    : Number.MAX_SAFE_INTEGER;
  if (filters.search && isEmailSearch(filters.search)) {
    const page = await ctx.db
      .query("applications")
      .withIndex("by_email", (q) =>
        q.eq("data.email", filters.search!.toLowerCase()),
      )
      .order("desc")
      .paginate({ ...paginationOpts, maximumRowsRead: 200 });
    return {
      ...page,
      page: page.page.filter(
        (row) =>
          (!status || row.status === status) &&
          applicationMatches(row, filters),
      ),
    };
  }
  if (filters.search) {
    const result = await ctx.db
      .query("applications")
      .withSearchIndex("search_applicants", (q) => {
        let search = q.search("searchText", filters.search!);
        if (status) search = search.eq("status", status);
        if (filters.source) search = search.eq("data.source", filters.source);
        if (filters.campaign)
          search = search.eq("data.campaign", filters.campaign);
        if (filters.jobId) search = search.eq("data.jobId", filters.jobId);
        return search;
      })
      .paginate(paginationOpts);
    return {
      ...result,
      page: result.page.filter((row) => applicationMatches(row, filters)),
    };
  }
  const query = filters.campaign
    ? ctx.db
        .query("applications")
        .withIndex("by_campaign_submittedAt", (q) =>
          q
            .eq("data.campaign", filters.campaign!)
            .gte("submittedAt", start)
            .lt("submittedAt", end),
        )
    : filters.jobId
      ? ctx.db
          .query("applications")
          .withIndex("by_jobId_submittedAt", (q) =>
            q
              .eq("data.jobId", filters.jobId!)
              .gte("submittedAt", start)
              .lt("submittedAt", end),
          )
      : filters.source
        ? ctx.db
            .query("applications")
            .withIndex("by_source_submittedAt", (q) =>
              q
                .eq("data.source", filters.source!)
                .gte("submittedAt", start)
                .lt("submittedAt", end),
            )
        : status
          ? ctx.db
              .query("applications")
              .withIndex("by_status_submittedAt", (q) =>
                q
                  .eq("status", status)
                  .gte("submittedAt", start)
                  .lt("submittedAt", end),
              )
          : ctx.db
              .query("applications")
              .withIndex("by_submittedAt", (q) =>
                q.gte("submittedAt", start).lt("submittedAt", end),
              );
  const result = await query
    .order("desc")
    .paginate({ ...paginationOpts, maximumRowsRead: 200 });
  return {
    ...result,
    page: result.page.filter(
      (row) =>
        (!status || row.status === status) && applicationMatches(row, filters),
    ),
  };
}
