import { auth } from "@clerk/nextjs/server";
export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  };
  if (!process.env.CLERK_SECRET_KEY || !process.env.CONVEX_SITE_URL)
    return new Response("Unavailable", { status: 503, headers });
  try {
    const session = await auth();
    if (!session.userId)
      return new Response("Unauthorized", { status: 401, headers });
    const token = await session.getToken({ template: "convex" });
    if (!token) return new Response("Unauthorized", { status: 401, headers });
    const response = await fetch(`${process.env.CONVEX_SITE_URL}/qr-logo`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    if (!response.ok)
      return new Response("Access denied or unavailable", {
        status: response.status,
        headers,
      });
    return new Response(response.body, {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=qr-logo.png",
      },
    });
  } catch {
    return new Response("Unable to load logo", { status: 503, headers });
  }
}
