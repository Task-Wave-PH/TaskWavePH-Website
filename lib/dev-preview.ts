import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocalHostname } from "./admin-host";
export async function isLocalPreview() {
  if (process.env.NODE_ENV !== "development") return false;
  const host = (await headers()).get("host") ?? "";
  try {
    return isLocalHostname(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
}
export async function requireLocalPreview() {
  if (!(await isLocalPreview())) notFound();
}
