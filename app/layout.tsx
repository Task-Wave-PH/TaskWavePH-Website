import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "TaskWavePH | Recruitment & Staffing",
    template: "%s | TaskWavePH",
  },
  description:
    "Explore BPO and staffing opportunities with TaskWavePH in the Philippines.",
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "TaskWavePH",
    title: "TaskWavePH | Recruitment & Staffing",
    description: "Take the next step in your career with TaskWavePH.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:p-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
