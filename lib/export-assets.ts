import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExportAssets } from "@/features/applications/export-assets";
export async function loadExportAssets(
  format: "pdf" | "xlsx",
): Promise<ExportAssets> {
  const read = async (path: string) =>
    (await readFile(join(process.cwd(), "public", path))).toString("base64");
  const [logo, regularFont, boldFont] = await Promise.all([
    read("logo/taskwaveph-symbol.png"),
    format === "pdf" ? read("fonts/poppins/Poppins-Regular.ttf") : undefined,
    format === "pdf" ? read("fonts/poppins/Poppins-SemiBold.ttf") : undefined,
  ]);
  return {
    logoDataUrl: `data:image/png;base64,${logo}`,
    regularFont,
    boldFont,
  };
}
