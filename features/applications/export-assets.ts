export type ExportAssets = {
  logoDataUrl: string;
  regularFont?: string;
  boldFont?: string;
};
function base64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
// Only fixed public brand files are fetched; applicant data never enters these URLs.
export async function loadPreviewExportAssets(
  format: "pdf" | "xlsx",
): Promise<ExportAssets> {
  async function read(path: string) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("BRAND_ASSET_UNAVAILABLE");
    return base64(await response.arrayBuffer());
  }
  const [logo, regularFont, boldFont] = await Promise.all([
    read("/logo/taskwaveph-symbol.png"),
    format === "pdf" ? read("/fonts/poppins/Poppins-Regular.ttf") : undefined,
    format === "pdf" ? read("/fonts/poppins/Poppins-SemiBold.ttf") : undefined,
  ]);
  return {
    logoDataUrl: `data:image/png;base64,${logo}`,
    regularFont,
    boldFont,
  };
}
