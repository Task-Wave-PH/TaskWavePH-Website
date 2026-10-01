import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval("expired uploads", { minutes: 15 }, internal.intake.cleanup, {});
crons.interval("orphan files", { hours: 1 }, internal.intake.cleanupOrphans, {
  cursor: null,
});
export default crons;
