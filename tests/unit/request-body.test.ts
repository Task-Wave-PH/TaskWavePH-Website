import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readSubmissionBody } from "../../features/submissions/request-body";
import { submissionRateKey } from "../../features/submissions/rate-key";
import { MAX_REQUEST_BYTES } from "../../features/submissions/validation";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
function streamingRequest(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
) {
  return new Request("http://localhost/submit", {
    method: "POST",
    body,
    signal,
    duplex: "half",
  } as RequestInit);
}
describe("bounded request streams", () => {
  it("cancels stalled reads on the deadline", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const request = streamingRequest(new ReadableStream({ cancel }));
    const result = expect(
      readSubmissionBody(request, 30),
    ).rejects.toMatchObject({ code: "REQUEST_TIMEOUT", status: 408 });
    await vi.advanceTimersByTimeAsync(30);
    await result;
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("cancels oversized chunked requests", async () => {
    const cancel = vi.fn();
    const request = streamingRequest(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES + 1));
        },
        cancel,
      }),
    );
    await expect(readSubmissionBody(request)).rejects.toMatchObject({
      code: "TOO_LARGE",
      status: 413,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("cancels when the caller disconnects and clears timers", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const controller = new AbortController();
    const result = expect(
      readSubmissionBody(
        streamingRequest(new ReadableStream({ cancel }), controller.signal),
      ),
    ).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
    controller.abort();
    await result;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("trusts forwarded IP information only on Vercel", () => {
    const secret = "test";
    const first = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });
    const second = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.2" },
    });
    vi.stubEnv("VERCEL", "");
    expect(submissionRateKey(first, secret)).toBe(
      submissionRateKey(second, secret),
    );
    vi.stubEnv("VERCEL", "1");
    expect(submissionRateKey(first, secret)).not.toBe(
      submissionRateKey(second, secret),
    );
    expect(submissionRateKey(first, secret)).toMatch(/^[a-f0-9]{64}$/);
    expect(
      submissionRateKey(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "invalid" },
        }),
        secret,
      ),
    ).toBe(submissionRateKey(new Request("http://localhost"), secret));
  });
});
