import { v } from "convex/values";
export const qrSettings = v.object({
  style: v.union(v.literal("solid"), v.literal("gradient")),
  color: v.string(),
  gradientColor: v.string(),
  logo: v.union(
    v.literal("symbol"),
    v.literal("wordmark"),
    v.literal("none"),
    v.literal("custom"),
  ),
  logoSize: v.union(v.literal(15), v.literal(20), v.literal(25)),
  channel: v.union(
    v.literal("linkedin"),
    v.literal("facebook"),
    v.literal("instagram"),
    v.literal("office-qr"),
    v.literal("job-fair"),
    v.literal("other"),
  ),
  placement: v.union(
    v.literal("social"),
    v.literal("paid-social"),
    v.literal("qr"),
    v.literal("referral"),
  ),
});
