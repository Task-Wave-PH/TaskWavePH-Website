"use client";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
const options = {
  isEvalSupported: false,
  disableRange: true,
  disableStream: true,
};
export default function PdfViewer({ url }: { url: string }) {
  return <PdfDocument key={url} url={url} />;
}
function PdfDocument({ url }: { url: string }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(320);
  const [error, setError] = useState(
    "Unable to display this PDF. You can try downloading it instead.",
  );
  function failed(error: Error) {
    setPages(0);
    setPage(1);
    setError(
      error.name === "InvalidPDFException"
        ? "This CV is not a readable PDF. Download it to check the file, or ask the applicant for a new PDF."
        : "Unable to load this CV. Check your staff access and try opening the CV again.",
    );
  }
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(200, entry.contentRect.width - 16)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="space-y-4" ref={container}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={!pages || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous page
        </Button>
        <span className="text-sm" role="status">
          Page {page} of {pages || "…"}
        </span>
        <Button
          variant="outline"
          disabled={!pages || page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </Button>
        <Button
          variant="outline"
          disabled={!pages || zoom <= 0.75}
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
          aria-label="Zoom out"
        >
          −
        </Button>
        <Button
          variant="outline"
          disabled={!pages || zoom >= 2}
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          aria-label="Zoom in"
        >
          +
        </Button>
        <Button variant="outline" disabled={!pages} onClick={() => setZoom(1)}>
          Fit to width
        </Button>
      </div>
      <div className="max-w-full overflow-auto rounded-lg border bg-muted p-2">
        <Document
          suspense={false}
          file={url}
          options={options}
          loading={<p role="status">Loading CV…</p>}
          error={
            <p
              role="alert"
              className="p-3 text-sm leading-6 text-muted-foreground"
            >
              {error}
            </p>
          }
          onSourceError={failed}
          onLoadError={failed}
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            setPage(1);
          }}
        >
          <Page
            pageNumber={page}
            width={Math.min(width, 900) * zoom}
            renderAnnotationLayer={false}
            loading={<p role="status">Rendering page…</p>}
            error={<p role="alert">Unable to render this page.</p>}
          />
        </Document>
      </div>
    </div>
  );
}
