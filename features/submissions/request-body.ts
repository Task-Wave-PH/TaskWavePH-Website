import { MAX_REQUEST_BYTES } from "./validation";

export class SubmissionBodyError extends Error {
  constructor(
    public readonly code:
      "TOO_LARGE" | "REQUEST_TIMEOUT" | "INVALID_SUBMISSION",
    public readonly status: number,
  ) {
    super(code);
  }
}

export async function readSubmissionBody(
  request: Request,
  timeoutMs = 30000,
  maxBytes = MAX_REQUEST_BYTES,
) {
  const reader = request.body?.getReader();
  if (!reader) throw new SubmissionBodyError("INVALID_SUBMISSION", 400);
  let aborted = false;
  let rejectDeadline: (reason: Error) => void = () => {};
  const deadline = new Promise<never>((_, reject) => {
    rejectDeadline = reject;
  });
  const cancel = () => {
    aborted = true;
    rejectDeadline(new SubmissionBodyError("REQUEST_TIMEOUT", 408));
    void reader.cancel().catch(() => {});
  };
  request.signal.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, timeoutMs);
  try {
    if (request.signal.aborted) cancel();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (aborted) throw new SubmissionBodyError("REQUEST_TIMEOUT", 408);
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new SubmissionBodyError("TOO_LARGE", 413);
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
