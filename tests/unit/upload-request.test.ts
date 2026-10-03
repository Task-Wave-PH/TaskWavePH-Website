import { afterEach, expect, it, vi } from "vitest";
import { uploadRequest } from "../../features/submissions/upload-request";
class RequestFixture {
  static current: RequestFixture;
  upload: {
    onprogress?: (event: {
      lengthComputable: boolean;
      loaded: number;
      total: number;
    }) => void;
    onload?: () => void;
  } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  status = 200;
  responseText = '{"success":true}';
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.onabort?.());
  getAllResponseHeaders() {
    return "Content-Type: application/json\r\nRetry-After: 60";
  }
  constructor() {
    RequestFixture.current = this;
  }
}
afterEach(() => vi.unstubAllGlobals());
it("reports actual bytes before processing and resolves only after server confirmation", async () => {
  vi.stubGlobal("XMLHttpRequest", RequestFixture);
  const progress = vi.fn(),
    uploaded = vi.fn(),
    controller = new AbortController();
  const response = uploadRequest(
    "/api/applications",
    new FormData(),
    controller.signal,
    progress,
    uploaded,
  );
  const request = RequestFixture.current;
  request.upload.onprogress?.({
    lengthComputable: true,
    loaded: 25,
    total: 100,
  });
  expect(progress).toHaveBeenCalledWith(25);
  request.upload.onload?.();
  expect(uploaded).toHaveBeenCalledOnce();
  let complete = false;
  void response.then(() => (complete = true));
  await Promise.resolve();
  expect(complete).toBe(false);
  request.onload?.();
  const result = await response;
  expect(await result.json()).toEqual({ success: true });
  expect(result.headers.get("retry-after")).toBe("60");
  controller.abort();
  expect(request.abort).not.toHaveBeenCalled();
});
it("aborts uploads with the caller and never sends an already cancelled request", async () => {
  vi.stubGlobal("XMLHttpRequest", RequestFixture);
  const controller = new AbortController();
  const response = uploadRequest(
    "/api/applications",
    new FormData(),
    controller.signal,
    vi.fn(),
    vi.fn(),
  );
  controller.abort();
  await expect(response).rejects.toMatchObject({ name: "AbortError" });
  const cancelled = uploadRequest(
    "/api/applications",
    new FormData(),
    controller.signal,
    vi.fn(),
    vi.fn(),
  );
  await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
  expect(RequestFixture.current.send).not.toHaveBeenCalled();
});
it("returns server failures for safe handling and rejects network failures", async () => {
  vi.stubGlobal("XMLHttpRequest", RequestFixture);
  const failed = uploadRequest(
    "/api/applications",
    new FormData(),
    new AbortController().signal,
    vi.fn(),
    vi.fn(),
  );
  RequestFixture.current.status = 429;
  RequestFixture.current.responseText =
    '{"success":false,"error":"RATE_LIMITED"}';
  RequestFixture.current.onload?.();
  expect((await failed).status).toBe(429);
  const network = uploadRequest(
    "/api/applications",
    new FormData(),
    new AbortController().signal,
    vi.fn(),
    vi.fn(),
  );
  RequestFixture.current.onerror?.();
  await expect(network).rejects.toThrow("SUBMISSION_UNAVAILABLE");
});

it.each([204, 205, 304])(
  "settles uploads safely for a bodyless %s response",
  async (status) => {
    vi.stubGlobal("XMLHttpRequest", RequestFixture);
    const pending = uploadRequest(
      "/api/applications",
      new FormData(),
      new AbortController().signal,
      vi.fn(),
      vi.fn(),
    );
    RequestFixture.current.status = status;
    RequestFixture.current.responseText = "";
    expect(() => RequestFixture.current.onload?.()).not.toThrow();
    const response = await pending;
    expect(response.status).toBe(status);
    expect(await response.text()).toBe("");
  },
);

it("rejects malformed response headers without throwing or leaving the upload pending", async () => {
  vi.stubGlobal("XMLHttpRequest", RequestFixture);
  const pending = uploadRequest(
    "/api/applications",
    new FormData(),
    new AbortController().signal,
    vi.fn(),
    vi.fn(),
  );
  RequestFixture.current.getAllResponseHeaders = () =>
    "Invalid header: fixture";
  expect(() => RequestFixture.current.onload?.()).not.toThrow();
  await expect(pending).rejects.toThrow("SUBMISSION_UNAVAILABLE");
});
