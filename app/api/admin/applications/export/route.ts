import { ConvexError } from "convex/values";
import { auth } from "@clerk/nextjs/server";
import type { FunctionReturnType } from "convex/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createExport, MAX_EXPORT_ROWS } from "@/features/applications/export";
import type { ApplicantView } from "@/features/applications/admin-types";
import { applicationStatuses } from "@/features/submissions/validation";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  };
  const json = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CONVEX_URL)
    return json("UNAVAILABLE", 503);
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "csv";
  const status = applicationStatuses.find((v) => v === params.get("status"));
  if (!["csv", "xlsx"].includes(format) || (params.has("status") && !status))
    return json("INVALID_EXPORT", 400);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const signal = AbortSignal.any([request.signal, controller.signal]);
  try {
    const session = await auth();
    if (!session.userId) return json("UNAUTHORIZED", 401);
    const token = await session.getToken({ template: "convex" });
    if (!token) return json("UNAUTHORIZED", 401);
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL, {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store", signal }),
    });
    client.setAuth(token);
    const rows: ApplicantView[] = [];
    let cursor: string | null = null;
    const deadline = Date.now() + 25000;
    while (true) {
      if (Date.now() >= deadline || signal.aborted)
        return json("EXPORT_UNAVAILABLE", 503);
      const result: FunctionReturnType<typeof api.exports.page> =
        await client.query(api.exports.page, {
          ...(status ? { status } : {}),
          paginationOpts: { cursor, numItems: 100 },
        });
      rows.push(...result.page);
      if (rows.length > MAX_EXPORT_ROWS) return json("EXPORT_TOO_LARGE", 413);
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    const bytes = await createExport(rows, format as "csv" | "xlsx");
    if (signal.aborted) return json("EXPORT_UNAVAILABLE", 503);
    await client.mutation(api.exports.audit, {
      format: format as "csv" | "xlsx",
      count: rows.length,
    });
    return new Response(new Uint8Array(bytes).buffer, {
      headers: {
        ...headers,
        "Content-Type":
          format === "csv"
            ? "text/csv; charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="taskwaveph-applicants-${new Date().toISOString().slice(0, 10)}.${format}"`,
      },
    });
  } catch (error) {
    if (
      error instanceof ConvexError &&
      ["UNAUTHORIZED", "FORBIDDEN"].includes(String(error.data))
    )
      return json("ACCESS_DENIED", 403);
    return json("EXPORT_FAILED", 503);
  } finally {
    clearTimeout(timeout);
  }
}
