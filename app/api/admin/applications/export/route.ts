import { z } from "zod";
import { readSubmissionBody } from "@/features/submissions/request-body";
import { loadExportAssets } from "@/lib/export-assets";
import {
  applicationFiltersSchema,
  campaignReport,
} from "@/features/applications/campaigns";
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
  return handleExport(request);
}
export async function POST(request: Request) {
  return handleExport(request);
}
async function handleExport(request: Request) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  };
  const json = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CONVEX_URL)
    return json("UNAVAILABLE", 503);
  let params = new URL(request.url).searchParams;
  if (request.method === "POST") {
    if (
      request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      return json("FORBIDDEN", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json("INVALID_EXPORT", 400);
    try {
      const input = z
        .object({
          format: z.enum(["csv", "xlsx", "pdf", "report"]).optional(),
          status: z.string().optional(),
          ...applicationFiltersSchema.shape,
        })
        .strict()
        .parse(
          JSON.parse(
            new TextDecoder().decode(
              await readSubmissionBody(request, 5000, 8192),
            ),
          ),
        );
      params = new URLSearchParams(
        Object.entries(input).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      );
    } catch {
      return json("INVALID_EXPORT", 400);
    }
  } else if (params.has("search")) return json("INVALID_EXPORT", 400);

  const format = params.get("format") ?? "csv";
  const status = applicationStatuses.find((v) => v === params.get("status"));
  const filters = applicationFiltersSchema.safeParse(
    Object.fromEntries(
      ["search", "source", "campaign", "jobId", "from", "to"]
        .filter((key) => params.has(key))
        .map((key) => [key, params.get(key)]),
    ),
  );
  if (
    !filters.success ||
    !["csv", "xlsx", "pdf", "report"].includes(format) ||
    (params.has("status") && !status)
  )
    return json("INVALID_EXPORT", 400);
  const deadline = Date.now() + 25000;
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
    const budget = await client.mutation(api.exports.begin, {});
    if (!budget.allowed)
      return Response.json(
        { error: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(budget.retryAfterSeconds),
          },
        },
      );
    const rows: ApplicantView[] = [];
    let cursor: string | null = null;
    let pages = 0;
    while (true) {
      if (++pages > 100) return json("EXPORT_TOO_LARGE", 413);
      if (Date.now() >= deadline || signal.aborted)
        return json("EXPORT_UNAVAILABLE", 503);
      const result: FunctionReturnType<typeof api.exports.page> =
        await client.query(api.exports.page, {
          ...(status ? { status } : {}),
          filters: filters.data,
          paginationOpts: { cursor, numItems: 100 },
        });
      rows.push(...result.page);
      if (rows.length > MAX_EXPORT_ROWS) return json("EXPORT_TOO_LARGE", 413);
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    if (signal.aborted || Date.now() >= deadline)
      return json("EXPORT_UNAVAILABLE", 503);
    if (format === "report")
      return Response.json(campaignReport(rows), { headers });
    const assets =
      format === "csv"
        ? undefined
        : await loadExportAssets(format as "pdf" | "xlsx");
    const bytes = await createExport(rows, format as "csv" | "xlsx" | "pdf", {
      assets,
      filters: filters.data,
      status,
    });
    if (signal.aborted || Date.now() >= deadline)
      return json("EXPORT_UNAVAILABLE", 503);
    await client.mutation(api.exports.audit, {
      format: format as "csv" | "xlsx" | "pdf",
      count: rows.length,
    });
    if (signal.aborted || Date.now() >= deadline)
      return json("EXPORT_UNAVAILABLE", 503);
    return new Response(new Uint8Array(bytes).buffer, {
      headers: {
        ...headers,
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : format === "csv"
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
