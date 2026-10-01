import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
export const metadata = {
  title: "Enquiry received",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-3xl px-5 py-20">
        <h1 className="text-3xl font-semibold">Enquiry received.</h1>
        <p className="mt-5 leading-relaxed">
          Thank you for reaching out to TaskWavePH. Our team will review your
          business support needs.
        </p>
        <Link href="/" className="mt-6 inline-block text-primary underline">
          Return home
        </Link>
      </main>
      <Footer />
    </>
  );
}
