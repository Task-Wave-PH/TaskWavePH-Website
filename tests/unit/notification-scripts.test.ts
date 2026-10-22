import { afterEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { withNotificationTarget } from "../../scripts/notification-target.mjs";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));
vi.mock("../../scripts/development-target.mjs", () => ({
  requireDevelopmentTarget: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.resetModules();
});
describe("notification script deployment isolation", () => {
  for (const [kind, deployment, prefix] of [
    ["development", "exuberant-lapwing-339", "dev"],
    ["production", "fabulous-crane-816", "prod"],
  ] as const) {
    it(`pins ${kind} despite inherited deployment credentials`, async () => {
      vi.stubEnv("CONVEX_DEPLOY_KEY", "synthetic-wrong-deployment-key");
      vi.stubEnv("CONVEX_DEPLOYMENT_TOKEN", "synthetic-wrong-token");
      vi.stubEnv("CONVEX_SELF_HOSTED_URL", "https://wrong.invalid");
      vi.mocked(spawnSync).mockReturnValue({
        status: 0,
        stdout: "ok\n",
        stderr: "",
        pid: 1,
        signal: null,
        output: [],
      });
      let targetFile = "";
      await withNotificationTarget(kind, (cli) => {
        expect(cli(["env", "get", "APPLICATION_NOTIFICATIONS_ENABLED"])).toBe(
          "ok",
        );
        const [, args, options] = vi.mocked(spawnSync).mock.calls[0];
        const argv = args as string[];
        expect(argv.slice(-2)).toEqual(["--deployment-name", deployment]);
        targetFile = argv[argv.indexOf("--env-file") + 1];
        expect(readFileSync(targetFile, "utf8")).toBe(
          `CONVEX_DEPLOYMENT=${prefix}:${deployment}\n`,
        );
        expect(options?.env).not.toHaveProperty("CONVEX_DEPLOY_KEY");
        expect(options?.env).not.toHaveProperty("CONVEX_DEPLOYMENT_TOKEN");
        expect(options?.env).not.toHaveProperty("CONVEX_SELF_HOSTED_URL");
      });
      expect(existsSync(targetFile)).toBe(false);
    });
  }
  it("removes the target file when CLI access fails without leaking diagnostics", async () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 1,
      stdout: "",
      stderr: "synthetic-secret",
      pid: 1,
      signal: null,
      output: [],
    });
    await expect(
      withNotificationTarget("production", (cli) =>
        cli(["env", "get", "RESEND_API_KEY"]),
      ),
    ).rejects.toThrow("Notification command failed");
    const args = vi.mocked(spawnSync).mock.calls[0][1] as string[];
    expect(existsSync(args[args.indexOf("--env-file") + 1])).toBe(false);
  });
  it("does not enable development sending before non-secret values verify", async () => {
    vi.stubEnv("CONVEX_DEPLOYMENT", "dev:exuberant-lapwing-339");
    vi.stubEnv("CONVEX_DEPLOY_KEY", undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(spawnSync).mockImplementation((_command, args) => {
      const argv = args as string[];
      return {
        status: 0,
        stdout: argv[2] === "get" ? "unexpected-value" : "",
        stderr: "",
        pid: 1,
        signal: null,
        output: [],
      };
    });
    await expect(
      import("../../scripts/configure-application-notifications.mjs"),
    ).rejects.toThrow("Verification failed");
    const commands = vi
      .mocked(spawnSync)
      .mock.calls.map((call) => call[1] as string[]);
    expect(
      commands.some(
        (args) =>
          args[2] === "set" &&
          args[3] === "APPLICATION_NOTIFICATIONS_ENABLED" &&
          args[4] === "true",
      ),
    ).toBe(false);
  });
  it("production setup keeps sending disabled and never replaces or prints keys", async () => {
    vi.stubEnv("CONVEX_DEPLOY_KEY", "synthetic-wrong-key");
    const values = new Map<string, string>();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(spawnSync).mockImplementation((_command, args) => {
      const argv = args as string[];
      if (argv[2] === "set") values.set(argv[3], argv[4]);
      return {
        status: 0,
        stdout:
          argv[2] === "get"
            ? (values.get(argv[3]) ?? "synthetic-private-credential")
            : "",
        stderr: "",
        pid: 1,
        signal: null,
        output: [],
      };
    });
    await import("../../scripts/configure-production-application-notifications.mjs");
    expect(values.get("APPLICATION_NOTIFICATIONS_ENABLED")).toBe("false");
    expect(values.get("APPLICATION_NOTIFICATION_ADMIN_URL")).toBe(
      "https://admin.taskwaveph.com",
    );
    expect(values.has("RESEND_API_KEY")).toBe(false);
    expect(values.has("RESEND_WEBHOOK_SECRET")).toBe(false);
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "synthetic-private-credential",
    );
  });
  it("deactivates synthetic staff even when smoke-record cleanup fails", async () => {
    vi.stubEnv("CONVEX_DEPLOYMENT", "dev:exuberant-lapwing-339");
    const commands: string[][] = [];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(spawnSync).mockImplementation((_command, args) => {
      const argv = args as string[];
      commands.push(argv);
      const failure = argv[1] === "run" && argv[2] === "admin:list";
      return {
        status: failure ? 1 : 0,
        stdout: "",
        stderr: "",
        pid: 1,
        signal: null,
        output: [],
      };
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Synthetic intake failure")),
    );
    try {
      await expect(
        import("../../scripts/smoke-application-notifications.mjs"),
      ).rejects.toThrow("Notification command failed");
      expect(
        commands.some(
          (args) =>
            args[2] === "provision:setStaff" &&
            JSON.parse(args[3]).active === false,
        ),
      ).toBe(true);
      expect(log).not.toHaveBeenCalledWith(
        expect.stringContaining("Disposable applications removed"),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
