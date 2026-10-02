import http from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, platform, arch } from "node:os";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

// Local fixtures only: never load environment files or call external services.
const fixtureOrigin = "http://127.0.0.1:3217";
const base = new URL(process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3105");
if (base.protocol !== "http:" || base.hostname !== "127.0.0.1")
  throw new Error("Audit target must be loopback HTTP.");

if (process.argv.includes("--fixtures")) {
  const sessionId = randomUUID();
  let generation = 1;
  let queries = 0;
  const server = http.createServer(async (req, res) => {
    if (req.url === "/fixture/control" && req.method === "POST") {
      generation++;
      res.end("ok");
      return;
    }
    if (req.url === "/fixture/stats") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ generation, queries, sessionId }));
      return;
    }
    if (req.url !== "/api/query" || req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }
    queries++;
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 65536) {
        res.writeHead(413).end();
        return;
      }
    }
    try {
      const request = JSON.parse(body);
      const job = {
        _id: "audit-role",
        title: `Audit role ${generation}`,
        serviceArea: "Customer Support",
        location: "Dagupan City",
        arrangement: "Remote",
        employmentType: "Full-time",
        description: `Synthetic role used only for isolated local verification. Fixture session: ${sessionId}`,
        responsibilities: "Synthetic responsibilities",
        requirements: "Synthetic requirements",
        salary: "",
        status: "Published",
        updatedAt: generation,
        publishedAt: generation,
      };
      const value =
        request.path === "jobs:detail"
          ? job
          : request.path === "jobs:published"
            ? { page: [job], isDone: true, continueCursor: "" }
            : null;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "success", value, logLines: [] }));
    } catch {
      res.writeHead(400).end();
    }
  });
  server.listen(3217, "127.0.0.1", () =>
    console.log("Local audit fixtures ready on port 3217"),
  );
  process.on("SIGTERM", () => server.close());
} else {
  const fixtureRequest = async (path, options = {}) => {
    const response = await fetch(`${fixtureOrigin}${path}`, {
      ...options,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, "Local fixture request failed");
    return response;
  };
  const initialFixture = await (await fixtureRequest("/fixture/stats")).json();
  assert.equal(typeof initialFixture.sessionId, "string");
  assert.match(initialFixture.sessionId, /^[0-9a-f-]{36}$/);
  assert.ok(Number.isInteger(initialFixture.generation));
  const initialGeneration = initialFixture.generation;
  const request = (path, options = {}) =>
    fetch(new URL(path, base), {
      ...options,
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
  // One uncached, unique detail request must prove this app reaches this fixture
  // session before any load is generated. A localhost URL alone is not proof.
  const preflight = await request(
    `/careers/audit-probe-${initialFixture.sessionId}`,
  );
  assert.equal(preflight.status, 200, "Fixture preflight failed");
  assert.ok(
    (await preflight.text()).includes(initialFixture.sessionId),
    "App is not connected to the current local fixture; load test refused",
  );
  const connectedFixture = await (
    await fixtureRequest("/fixture/stats")
  ).json();
  assert.equal(connectedFixture.sessionId, initialFixture.sessionId);
  assert.ok(
    connectedFixture.queries > initialFixture.queries,
    "Fixture must receive the preflight query",
  );
  console.log("Local fixture isolation verified before load generation");
  if (process.argv.includes("--preflight-only")) process.exit(0);
  const results = {
    measuredAt: new Date().toISOString(),
    environment: {
      node: process.version,
      os: platform(),
      architecture: arch(),
      cpu: cpus()[0]?.model,
    },
    sampleCount: 20,
    benchmarks: [],
    security: [],
    cache: {},
  };
  const cases = [
    ["home", "/", 200],
    ["services", "/areas-of-work", 200],
    ["careers", "/careers", 200],
    ["apply", "/apply", 200],
    ["denied-admin", "/admin", 404],
    ["denied-export", "/api/admin/applications/export", 404],
    [
      "disabled-submission",
      "/api/applications",
      503,
      { method: "POST", body: "{}" },
    ],
  ];
  const percentile = (values, p) =>
    Number(values[Math.ceil(values.length * p) - 1].toFixed(2));
  for (const [name, path, expected, options] of cases) {
    const firstStart = performance.now();
    const first = await request(path, options);
    assert.equal(first.status, expected, name);
    await first.arrayBuffer();
    const firstMs = Number((performance.now() - firstStart).toFixed(2));
    for (const concurrency of [1, 5]) {
      let next = 0;
      const times = [];
      let errors = 0;
      const start = performance.now();
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (next++ < results.sampleCount) {
            const before = performance.now();
            try {
              const response = await request(path, options);
              await response.arrayBuffer();
              if (response.status !== expected) errors++;
            } catch {
              errors++;
            }
            times.push(performance.now() - before);
          }
        }),
      );
      const duration = performance.now() - start;
      times.sort((a, b) => a - b);
      results.benchmarks.push({
        name,
        concurrency,
        firstMs,
        errors,
        p50Ms: percentile(times, 0.5),
        p95Ms: percentile(times, 0.95),
        p99Ms: percentile(times, 0.99),
        requestsPerSecond: Number(
          (times.length / (duration / 1000)).toFixed(2),
        ),
      });
      assert.equal(errors, 0, `${name} unexpected responses`);
    }
    console.log(`Measured ${name} at 1 and 5 concurrent requests`);
  }
  for (const path of [
    "/admin",
    "/admin/users",
    "/api/admin/resumes/forged",
    "/api/admin/applications/export",
    "/__clerk/test",
    "/dev-preview",
  ]) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, path);
    results.security.push({
      path,
      status: response.status,
      cacheControl: response.headers.get("cache-control"),
    });
  }
  for (const path of ["/apply/success", "/business-enquiry/success"]) {
    const response = await request(path, {
      headers: {
        cookie: "tw-application-receipt=forged; tw-enquiry-receipt=forged",
      },
    });
    assert.ok([307, 308].includes(response.status));
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    results.security.push({
      path,
      status: response.status,
      location: response.headers.get("location"),
    });
  }
  const malicious = await request(
    "/?source=%3Cscript%3Ealert(1)%3C%2Fscript%3E&email=private%40example.invalid",
  );
  const html = await malicious.text();
  assert.ok(!html.includes("<script>alert(1)</script>"));
  // Next serializes the requested URL in its router payload; check app links,
  // rather than treating framework reflection of the caller's URL as a leak.
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
  assert.ok(
    hrefs.every(
      (href) => !href.includes("private") && !href.includes("email="),
    ),
  );
  results.security.push({
    test: "tracking input is escaped and private query parameters are not propagated",
    passed: true,
  });
  const before = await (await request("/careers")).text();
  assert.ok(
    before.includes(`Audit role ${initialGeneration}`),
    "Fixture isolation is required",
  );
  await fixtureRequest("/fixture/control", { method: "POST" });
  const immediate = await (await request("/careers")).text();
  assert.ok(
    immediate.includes(`Audit role ${initialGeneration}`),
    "First-page cache should retain fresh data",
  );
  const detail = await (await request("/careers/audit-role")).text();
  assert.ok(
    detail.includes(`Audit role ${initialGeneration + 1}`),
    "Detail must bypass stale lists",
  );
  console.log(
    "Checking the 60-second job cache TTL; waiting 61 seconds locally...",
  );
  await new Promise((resolve) => setTimeout(resolve, 61000));
  await (await request("/careers")).arrayBuffer();
  // Time-based revalidation may serve one stale response while refreshing.
  let refreshed = false;
  for (let i = 0; i < 10 && !refreshed; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    refreshed = (await (await request("/careers")).text()).includes(
      `Audit role ${initialGeneration + 1}`,
    );
  }
  assert.ok(refreshed, "Job list must refresh after TTL");
  results.cache = {
    firstPageCached: true,
    detailFreshImmediately: true,
    refreshedAfter61Seconds: true,
    fixture: await (await fixtureRequest("/fixture/stats")).json(),
  };
  await mkdir("output/security-audit", { recursive: true });
  await writeFile(
    "output/security-audit/results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(
    "Local audit passed; results: output/security-audit/results.json",
  );
}
