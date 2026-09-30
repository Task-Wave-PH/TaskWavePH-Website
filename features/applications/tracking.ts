import { trackingKeys } from "./schema";
import type { ApplicationTracking } from "./types";

type Query = Record<string, string | string[] | undefined>;

export function getTracking(
  query: Query,
  pathname = "/apply",
): ApplicationTracking {
  const values = Object.fromEntries(
    trackingKeys.map((key) => {
      const raw = query[key];
      return [
        key,
        ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, 200),
      ];
    }),
  );
  return {
    source: values.source,
    campaign: values.campaign,
    utm_source: values.utm_source,
    utm_medium: values.utm_medium,
    utm_campaign: values.utm_campaign,
    landing_page: pathname,
  };
}

export function getApplyHref(query: Query): string {
  const tracking = getTracking(query);
  const params = new URLSearchParams();
  for (const key of trackingKeys) {
    if (tracking[key]) params.set(key, tracking[key]);
  }
  return params.size ? `/apply?${params.toString()}` : "/apply";
}
