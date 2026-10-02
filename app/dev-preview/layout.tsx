import { requireLocalPreview } from "@/lib/dev-preview";
import { PreviewProvider } from "@/components/admin/preview-provider";
import { OperationToaster } from "@/components/admin/operation-toaster";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireLocalPreview();
  return (
    <PreviewProvider>
      {children}
      <OperationToaster />
    </PreviewProvider>
  );
}
