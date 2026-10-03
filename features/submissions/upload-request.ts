// Upload progress measures bytes sent only. Saving completes after the server responds.
export function uploadRequest(
  endpoint: string,
  body: FormData,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
  onUploaded: () => void,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    request.open("POST", endpoint);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        );
    };
    request.upload.onload = onUploaded;
    request.onload = () => {
      cleanup();
      if (request.status < 200 || request.status > 599) {
        reject(new Error("SUBMISSION_UNAVAILABLE"));
        return;
      }
      try {
        const headers = new Headers();
        for (const line of request
          .getAllResponseHeaders()
          .trim()
          .split(/[\r\n]+/)) {
          const colon = line.indexOf(":");
          if (colon > 0)
            headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
        }
        resolve(
          new Response(
            [204, 205, 304].includes(request.status)
              ? null
              : request.responseText,
            { status: request.status, headers },
          ),
        );
      } catch {
        reject(new Error("SUBMISSION_UNAVAILABLE"));
      }
    };
    request.onerror = () => {
      cleanup();
      reject(new Error("SUBMISSION_UNAVAILABLE"));
    };
    request.onabort = () => {
      cleanup();
      reject(new DOMException("Request aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      cleanup();
      reject(new DOMException("Request aborted", "AbortError"));
      return;
    }
    try {
      request.send(body);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
