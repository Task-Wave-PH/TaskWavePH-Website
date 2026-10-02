import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  companyStructuredData,
  serializeJsonLd,
  shareImage,
} from "@/lib/seo";

describe("public SEO", () => {
  it("uses the configured origin and removes tracking and fragments", () => {
    expect(
      canonicalUrl(
        "https://www.taskwaveph.com/?source=qr",
        "/apply?email=private@example.com#form",
      ),
    ).toBe("https://www.taskwaveph.com/apply");
    expect(canonicalUrl("https://www.taskwaveph.com/", "/")).toBe(
      "https://www.taskwaveph.com",
    );
    expect(
      canonicalUrl(
        "https://www.taskwaveph.com",
        "https://other.example/about?source=qr",
      ),
    ).toBe("https://www.taskwaveph.com/about");
  });
  it("provides a branded share image with explicit dimensions", () => {
    expect(shareImage("https://www.taskwaveph.com")).toMatchObject({
      url: "https://www.taskwaveph.com/images/seo/taskwaveph-share.png",
      width: 1200,
      height: 630,
    });
  });
  it("links factual company and website entities without invented contacts", () => {
    const data = companyStructuredData("https://www.taskwaveph.com/");
    expect(data["@graph"][0]).toMatchObject({
      name: "TaskWavePH",
      address: {
        addressLocality: "Dagupan City",
        addressRegion: "Pangasinan",
        addressCountry: "PH",
      },
    });
    expect(data["@graph"][1].publisher).toEqual({
      "@id": "https://www.taskwaveph.com/#organization",
    });
    expect(JSON.stringify(data)).not.toContain("telephone");
  });
  it("escapes script terminators while preserving valid JSON", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const serialized = serializeJsonLd(data);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
