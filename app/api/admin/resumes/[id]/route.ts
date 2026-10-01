import { auth } from "@clerk/nextjs/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };
  if (!process.env.CLERK_SECRET_KEY || !process.env.CONVEX_SITE_URL)
    return new Response("Unavailable", { status: 503, headers });
  try {
    const session = await auth();
    if (!session.userId)
      return new Response("Unauthorized", { status: 401, headers });
    const token = await session.getToken({ template: "convex" });
    if (!token) return new Response("Unauthorized", { status: 401, headers });
    const { id } = await params;
    const response = await fetch(
      `${process.env.CONVEX_SITE_URL}/resume?id=${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      return new Response("Access denied or file unavailable", {
        status: response.status,
        headers,
      });
    return new Response(response.body, {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Unable to download", { status: 503, headers });
  }
}
