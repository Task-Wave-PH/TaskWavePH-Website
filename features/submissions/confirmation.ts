import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  confirmationRoutes,
  verifyReceipt,
  type SubmissionKind,
} from "./receipt";

export async function requireSubmissionReceipt(kind: SubmissionKind) {
  const route = confirmationRoutes[kind];
  const value = (await cookies()).get(route.cookie)?.value;
  if (!verifyReceipt(value, kind, process.env.CONVEX_SERVER_SECRET))
    redirect(route.form);
}
