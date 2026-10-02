import { describe, expect, it } from "vitest";
import { filterAnalyticsEvent } from "@/lib/analytics";
const origin = "https://www.taskwaveph.com";
describe("public analytics privacy boundary", () => {
  it("removes queries and fragments from public page views", () => {
    expect(
      filterAnalyticsEvent(
        {
          type: "pageview",
          url: `${origin}/apply?email=private@example.com&source=qr#private`,
        },
        origin,
      ),
    ).toEqual({ type: "pageview", url: `${origin}/apply` });
    expect(
      filterAnalyticsEvent(
        { type: "pageview", url: `${origin}/careers/job123` },
        origin,
      )?.url,
    ).toBe(`${origin}/careers/job123`);
  });
  it.each([
    "/admin",
    "/admin/users",
    "/api/admin/resumes/123",
    "/dev-preview",
    "/apply/success",
    "/business-enquiry/success",
    "/unknown",
    "/careers/private%40example.com",
  ])("does not send %s", (path) => {
    expect(
      filterAnalyticsEvent(
        { type: "pageview", url: `${origin}${path}` },
        origin,
      ),
    ).toBeNull();
  });
  it("rejects custom events, other hosts, and malformed URLs", () => {
    expect(
      filterAnalyticsEvent({ type: "event", url: `${origin}/apply` }, origin),
    ).toBeNull();
    expect(
      filterAnalyticsEvent(
        { type: "pageview", url: "https://admin.taskwaveph.com/" },
        origin,
      ),
    ).toBeNull();
    expect(
      filterAnalyticsEvent({ type: "pageview", url: "invalid" }, origin),
    ).toBeNull();
  });
});
