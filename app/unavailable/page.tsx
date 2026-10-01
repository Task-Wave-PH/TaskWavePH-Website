import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

// Proxy rejections render the shared 404 without exposing an admin route.
export default function Page() {
  notFound();
}
