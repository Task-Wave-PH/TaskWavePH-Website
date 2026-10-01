import { describe, expect, it } from "vitest";
import { cacheableJobList } from "../../features/jobs/cache-policy";
function request(
  args: object = { paginationOpts: { numItems: 12, cursor: null } },
  path = "jobs:published",
) {
  return { method: "POST", body: JSON.stringify({ path, args: [args] }) };
}
describe("public job cache boundaries", () => {
  it("allows only bounded first pages and valid filters", () => {
    expect(cacheableJobList(request())).toBe(true);
    expect(
      cacheableJobList(
        request({
          serviceArea: "Customer Support",
          arrangement: "Remote",
          paginationOpts: { numItems: 100, cursor: null },
        }),
      ),
    ).toBe(true);
    for (const args of [
      { paginationOpts: { numItems: 12, cursor: "arbitrary" } },
      { paginationOpts: { numItems: 5000, cursor: null } },
      {
        serviceArea: "invalid",
        paginationOpts: { numItems: 12, cursor: null },
      },
      { source: "private", paginationOpts: { numItems: 12, cursor: null } },
    ])
      expect(cacheableJobList(request(args))).toBe(false);
  });
  it("rejects private queries, credentials and malformed input", () => {
    expect(cacheableJobList(request({}, "applications:list"))).toBe(false);
    expect(
      cacheableJobList({ ...request(), headers: { Authorization: "private" } }),
    ).toBe(false);
    expect(cacheableJobList({ method: "POST", body: "bad" })).toBe(false);
  });
});
