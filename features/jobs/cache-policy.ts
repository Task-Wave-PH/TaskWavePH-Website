import { z } from "zod";
import { serviceAreas, workArrangements } from "./schema";
const firstPageRequest = z.object({
  path: z.literal("jobs:published"),
  args: z.tuple([
    z.strictObject({
      serviceArea: z.enum(serviceAreas).optional(),
      arrangement: z.enum(workArrangements).optional(),
      paginationOpts: z.strictObject({
        numItems: z.union([z.literal(12), z.literal(100)]),
        cursor: z.null(),
      }),
    }),
  ]),
});
// Deployment URL and bounded POST body form the fetch cache key. No tracking,
// cookies, credentials, private queries, or arbitrary cursors qualify.
export function cacheableJobList(init?: RequestInit): boolean {
  if (init?.method !== "POST" || typeof init.body !== "string") return false;
  if (new Headers(init.headers).has("authorization")) return false;
  try {
    return firstPageRequest.safeParse(JSON.parse(init.body)).success;
  } catch {
    return false;
  }
}
