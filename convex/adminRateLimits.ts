import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

const limiter = new RateLimiter(components.rateLimiter, {
  adminExports: { kind: "fixed window", rate: 5, period: 10 * MINUTE },
  adminExportsGlobal: { kind: "fixed window", rate: 20, period: 10 * MINUTE },
  adminResumes: { kind: "fixed window", rate: 30, period: MINUTE },
  adminResumesGlobal: { kind: "fixed window", rate: 120, period: MINUTE },
});
export async function limitAdminOperation(
  ctx: MutationCtx,
  actor: string,
  operation: "export" | "resume",
) {
  const local = await limiter.limit(
    ctx,
    operation === "export" ? "adminExports" : "adminResumes",
    { key: actor },
  );
  if (!local.ok)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((local.retryAfter ?? MINUTE) / 1000),
      ),
    };
  const global = await limiter.limit(
    ctx,
    operation === "export" ? "adminExportsGlobal" : "adminResumesGlobal",
  );
  return {
    allowed: global.ok,
    retryAfterSeconds: global.ok
      ? 0
      : Math.max(1, Math.ceil((global.retryAfter ?? MINUTE) / 1000)),
  };
}
