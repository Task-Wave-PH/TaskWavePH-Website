import { isLocalPreview } from "@/lib/dev-preview";
import { PreviewJobsProvider } from "@/components/jobs/preview-provider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const poppins = localFont({
  src: [
    {
      path: "../public/fonts/poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/poppins/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/poppins/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "TaskWavePH | Outsourcing & Business Support",
    template: "%s | TaskWavePH",
  },
  description:
    "Philippine talent and business support services to help your company streamline operations and grow.",
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "TaskWavePH",
    title: "TaskWavePH | Outsourcing & Business Support",
    description: "We handle the tasks. You focus on growth.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const localPreview = await isLocalPreview();
  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:p-4"
        >
          Skip to content
        </a>
        {localPreview ? (
          <PreviewJobsProvider>{children}</PreviewJobsProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
