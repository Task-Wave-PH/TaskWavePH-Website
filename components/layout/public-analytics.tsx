"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { filterAnalyticsEvent, isAnalyticsPage } from "@/lib/analytics";

export function PublicAnalytics({ publicOrigin }: { publicOrigin: string }) {
  const pathname = usePathname();
  if (!pathname || !isAnalyticsPage(pathname)) return null;
  return (
    <Analytics
      mode="production"
      debug={false}
      beforeSend={(event) => filterAnalyticsEvent(event, publicOrigin)}
    />
  );
}
