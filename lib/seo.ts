/** Canonicals use the configured site origin, never visitor tracking parameters. */
export function canonicalUrl(siteUrl: string, pathname: string): string {
  const origin = new URL(siteUrl).origin;
  const path = new URL(pathname, `${origin}/`).pathname;
  return path === "/" ? origin : `${origin}${path}`;
}

export function shareImage(siteUrl: string) {
  return {
    url: canonicalUrl(siteUrl, "/images/seo/taskwaveph-share.png"),
    width: 1200,
    height: 630,
    alt: "TaskWavePH — Outsource. Optimize. Grow. Philippine outsourcing and business support.",
  };
}

export function companyStructuredData(siteUrl: string) {
  const origin = canonicalUrl(siteUrl, "/");
  const organizationId = `${origin}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "TaskWavePH",
        url: origin,
        logo: canonicalUrl(origin, "/logo/taskwaveph-logo-transparent.png"),
        description:
          "TaskWavePH is a Philippine-based outsourcing and business support agency supporting global businesses through skilled professionals and efficient processes.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dagupan City",
          addressRegion: "Pangasinan",
          addressCountry: "PH",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "TaskWavePH",
        url: origin,
        inLanguage: "en-PH",
        publisher: { "@id": organizationId },
      },
    ],
  };
}

/** Prevent a value from terminating an inline JSON-LD script element. */
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
