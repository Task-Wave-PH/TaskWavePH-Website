import { submitRequest } from "@/features/submissions/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return submitRequest(request, "applications");
}
