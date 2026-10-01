import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAdminHostname, isLocalHostname } from "@/lib/admin-host";
const clerk = clerkMiddleware();
function privateResponse(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const path = request.nextUrl.pathname;
  const adminHost = isAdminHostname(
    request.nextUrl.hostname,
    process.env.NEXT_PUBLIC_ADMIN_URL,
  );
  const adminPath =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin/");
  if (adminHost && path === "/robots.txt")
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex" },
    });
  if (adminHost && path === "/sitemap.xml")
    return new NextResponse(null, { status: 404 });
  if (adminPath && !adminHost && !isLocalHostname(request.nextUrl.hostname))
    return new NextResponse(null, { status: 404 });
  if (!adminHost && !adminPath) {
    const response = NextResponse.next();
    return ["/apply/success", "/business-enquiry/success"].includes(path) ||
      path === "/dev-preview" ||
      path.startsWith("/dev-preview/")
      ? privateResponse(response)
      : response;
  }
  if (
    adminHost &&
    !adminPath &&
    !path.startsWith("/_next/") &&
    path !== "/icon.png"
  ) {
    if (
      !["/", "/applications", "/businessLeads", "/jobs", "/sign-in"].some(
        (prefix) =>
          prefix === "/"
            ? path === "/"
            : path === prefix || path.startsWith(`${prefix}/`),
      )
    )
      return privateResponse(new NextResponse(null, { status: 404 }));
  }
  const rewrite =
    adminHost &&
    !adminPath &&
    !path.startsWith("/_next/") &&
    path !== "/icon.png";
  let response: NextResponse;
  if (
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    const result = await clerk(request, event);
    response = result instanceof NextResponse ? result : NextResponse.next();
  } else response = NextResponse.next();
  if (rewrite) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${path === "/" ? "" : path}`;
    const routed = NextResponse.rewrite(url, {
      request: { headers: new Headers(request.headers) },
    });
    // Preserve Clerk's forwarded request headers and cookies on the host rewrite.
    response.headers.forEach((value, key) => routed.headers.set(key, value));
    routed.headers.delete("x-middleware-next");
    routed.headers.set("x-middleware-rewrite", url.toString());
    response = routed;
  }
  return privateResponse(response);
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|logo/).*)"],
};
