import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { jobSlugBase, numberedJobSlug } from "../features/jobs/urls";

/** Called only inside publication/migration transactions. Counters survive deletion. */
export async function allocateJobSlug(
  ctx: MutationCtx,
  title: string,
  timestamp: number,
) {
  const base = jobSlugBase(title, timestamp);
  const counter = await ctx.db
    .query("jobSlugCounters")
    .withIndex("by_base", (q) => q.eq("base", base))
    .unique();
  const sequence = (counter?.sequence ?? 0) + 1;
  if (counter) await ctx.db.patch(counter._id, { sequence });
  else await ctx.db.insert("jobSlugCounters", { base, sequence });
  return numberedJobSlug(base, sequence);
}
export const backfill = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ processed: v.number(), done: v.boolean() }),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("jobs").paginate({ cursor, numItems: 50 });
    let processed = 0;
    for (const job of page.page) {
      if (
        !job.slug &&
        (job.status === "Published" || job.publishedAt !== undefined)
      ) {
        const slug = await allocateJobSlug(
          ctx,
          job.title,
          job.publishedAt ?? job._creationTime,
        );
        await ctx.db.patch(job._id, { slug });
        processed++;
      }
    }
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.jobSlugs.backfill, {
        cursor: page.continueCursor,
      });
    return { processed, done: page.isDone };
  },
});
