import type { BeforeSendEvent } from "@vercel/analytics";

const publicPages = new Set([
  "/",
  "/areas-of-work",
  "/how-it-works",
  "/careers",
  "/about",
  "/apply",
  "/business-enquiry",
  "/privacy",
  "/terms",
]);

export function isAnalyticsPage(pathname: string) {
  return (
    publicPages.has(pathname) || /^\/careers\/[a-zA-Z0-9_-]+$/.test(pathname)
  );
}

export function filterAnalyticsEvent(
  event: BeforeSendEvent,
  publicOrigin: string,
): BeforeSendEvent | null {
  if (event.type !== "pageview") return null;
  try {
    const url = new URL(event.url);
    if (url.origin !== publicOrigin || !isAnalyticsPage(url.pathname))
      return null;
    return { type: "pageview", url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
}
