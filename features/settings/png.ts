export const MAX_QR_LOGO_BYTES = 1024 * 1024;
// Accept bounded, static PNGs only. CRC and chunk boundaries are checked before storage.
export function validateQrPng(bytes: Uint8Array): boolean {
  if (bytes.length < 57 || bytes.length > MAX_QR_LOGO_BYTES) return false;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((v, i) => bytes[i] === v)) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8,
    header = false,
    data = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12) return false;
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (!/^[A-Za-z]{4}$/.test(type) || type === "acTL") return false;
    let crc = 0xffffffff;
    for (let i = offset + 4; i < offset + 8 + length; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(offset + 8 + length))
      return false;
    if (!header) {
      if (type !== "IHDR" || length !== 13) return false;
      const width = view.getUint32(offset + 8),
        height = view.getUint32(offset + 12);
      if (!width || !height || width > 2048 || height > 2048) return false;
      const depth = bytes[offset + 16],
        color = bytes[offset + 17];
      if (
        !(
          color === 0
            ? [1, 2, 4, 8, 16]
            : color === 3
              ? [1, 2, 4, 8]
              : [2, 4, 6].includes(color)
                ? [8, 16]
                : []
        ).includes(depth)
      )
        return false;
      if (
        bytes[offset + 18] !== 0 ||
        bytes[offset + 19] !== 0 ||
        bytes[offset + 20] > 1
      )
        return false;
      header = true;
    } else if (type === "IHDR") return false;
    if (type === "IDAT") data = true;
    offset += length + 12;
    if (type === "IEND") return length === 0 && data && offset === bytes.length;
  }
  return false;
}
