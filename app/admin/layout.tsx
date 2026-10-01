import { AdminProviders } from "@/components/admin/providers";
export const metadata = {
  title: "Administration | TaskWavePH",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CONVEX_URL
  )
    return (
      <main className="mx-auto max-w-xl px-5 py-20">
        <h1 className="text-3xl font-semibold">Admin setup required</h1>
        <p className="mt-5">
          Configure development authentication and the Convex deployment before
          staff sign-in. No applicant information is available here.
        </p>
      </main>
    );
  return <AdminProviders>{children}</AdminProviders>;
}
