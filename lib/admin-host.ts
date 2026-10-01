export function isAdminHostname(
  hostname: string,
  adminUrl: string | undefined,
) {
  if (!adminUrl) return false;
  try {
    const configured = new URL(adminUrl);
    return (
      configured.hostname !== "localhost" &&
      configured.hostname !== "127.0.0.1" &&
      hostname === configured.hostname
    );
  } catch {
    return false;
  }
}
export function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}
