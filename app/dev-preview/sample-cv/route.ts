import { requireLocalPreview } from "@/lib/dev-preview";
import { sampleResumeBytes } from "@/features/applications/sample-resume";
export async function GET(request: Request) {
  await requireLocalPreview();
  const mode = new URL(request.url).searchParams.get("mode");
  return new Response(new Uint8Array(sampleResumeBytes()).buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="sample-cv.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
