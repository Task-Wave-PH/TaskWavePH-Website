import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import aggregate from "@convex-dev/aggregate/convex.config.js";
const app = defineApp();
app.use(rateLimiter);
app.use(aggregate, { name: "adminByTime" });
app.use(aggregate, { name: "adminByStatus" });
export default app;
