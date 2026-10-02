import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execute = promisify(execFile);
function fixtureCheck(connected: boolean) {
  return execute(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `
    let queried = false;
    const sessionId = "12345678-1234-1234-1234-123456789abc";
    globalThis.fetch = async (url, init) => {
      if (!init.signal || init.redirect !== "manual") throw new Error("Unbounded fixture request");
      if (String(url).endsWith("/fixture/stats"))
        return Response.json({sessionId, generation:1, queries:queried ? 1 : 0});
      if (String(url).includes("/careers/audit-probe-")) {
        queried = true;
        return new Response(${connected ? "sessionId" : '"Unrelated backend"'});
      }
      throw new Error("Load started before verified isolation");
    };
    process.argv.push("--preflight-only");
    await import("./scripts/audit-local.mjs");
  `,
    ],
    {
      env: { ...process.env, AUDIT_BASE_URL: "http://127.0.0.1:3106" },
      timeout: 5000,
    },
  );
}
describe("local audit isolation", () => {
  it("refuses to generate load when the app does not reach the current fixture", async () => {
    await expect(fixtureCheck(false)).rejects.toMatchObject({
      stderr: expect.stringContaining("load test refused"),
    });
  });
  it("accepts a verified fixture without generating load during preflight-only checks", async () => {
    expect((await fixtureCheck(true)).stdout).toContain(
      "isolation verified before load",
    );
  });
});
