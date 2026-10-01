import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocalHostname } from "./admin-host";
export async function requireLocalPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const host = (await headers()).get("host") ?? "";
  try {
    if (isLocalHostname(new URL(`http://${host}`).hostname)) return;
  } catch {}
  notFound();
}
