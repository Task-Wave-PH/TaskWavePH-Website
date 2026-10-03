import { followUpTimestamp } from "../features/leads/follow-up";
import { DirectAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export type MetricKind = "applications" | "businessLeads" | "jobs";
type MetricDoc = Doc<"applications"> | Doc<"businessLeads"> | Doc<"jobs">;
export const byTime = new DirectAggregate<{
  Key: number;
  Id: string;
  Namespace: string;
}>(components.adminByTime);
export const byStatus = new DirectAggregate<{
  Key: string;
  Id: string;
  Namespace: string;
}>(components.adminByStatus);
const timestamp = (doc: MetricDoc) =>
  "submittedAt" in doc ? doc.submittedAt : doc._creationTime;

// Idempotent operations keep live writes correct while older records are backfilled.
export async function syncMetrics(
  ctx: MutationCtx,
  kind: MetricKind,
  oldDoc: MetricDoc | null,
  newDoc: MetricDoc | null,
) {
  if (oldDoc && (!newDoc || timestamp(oldDoc) !== timestamp(newDoc)))
    await byTime.deleteIfExists(ctx, {
      namespace: kind,
      key: timestamp(oldDoc),
      id: oldDoc._id,
    });
  if (newDoc)
    await byTime.insertIfDoesNotExist(ctx, {
      namespace: kind,
      key: timestamp(newDoc),
      id: newDoc._id,
    });
  if (oldDoc && (!newDoc || oldDoc.status !== newDoc.status))
    await byStatus.deleteIfExists(ctx, {
      namespace: kind,
      key: oldDoc.status,
      id: oldDoc._id,
    });
  if (newDoc)
    await byStatus.insertIfDoesNotExist(ctx, {
      namespace: kind,
      key: newDoc.status,
      id: newDoc._id,
    });
  if (kind === "businessLeads") {
    if (
      oldDoc &&
      "nextFollowUp" in oldDoc &&
      oldDoc.nextFollowUp &&
      oldDoc.status !== "Closed"
    )
      await byTime.deleteIfExists(ctx, {
        namespace: "leadFollowUp",
        key: followUpTimestamp(oldDoc.nextFollowUp),
        id: oldDoc._id,
      });
    if (
      newDoc &&
      "nextFollowUp" in newDoc &&
      newDoc.nextFollowUp &&
      newDoc.status !== "Closed"
    )
      await byTime.insertIfDoesNotExist(ctx, {
        namespace: "leadFollowUp",
        key: followUpTimestamp(newDoc.nextFollowUp),
        id: newDoc._id,
      });
    if (oldDoc && "priority" in oldDoc && oldDoc.priority)
      await byStatus.deleteIfExists(ctx, {
        namespace: "priorityLeads",
        key: "Priority",
        id: oldDoc._id,
      });
    if (newDoc && "priority" in newDoc && newDoc.priority)
      await byStatus.insertIfDoesNotExist(ctx, {
        namespace: "priorityLeads",
        key: "Priority",
        id: newDoc._id,
      });
  }
}
