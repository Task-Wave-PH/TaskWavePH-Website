import { SignUp } from "@clerk/nextjs";
import { BrandLogo } from "@/components/layout/brand-logo";
import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/env";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ __clerk_ticket?: string }>;
}) {
  const { __clerk_ticket: ticket } = await searchParams;
  if (!ticket || typeof ticket !== "string" || ticket.length > 8192)
    return (
      <StatusPage
        kind="access"
        title="An invitation is required."
        description="Staff accounts are created by invitation. Ask a TaskWavePH owner to invite you, or sign in with your existing account."
        homeHref={getSiteUrl()}
      >
        <Link
          href="/admin/sign-in"
          className={buttonVariants({
            className: "min-h-11 w-full px-5 sm:w-fit",
          })}
        >
          Back to sign in
        </Link>
      </StatusPage>
    );
  return (
    <main
      id="main-content"
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-secondary/50 p-5 md:p-10"
    >
      <BrandLogo eager />
      <h1 className="text-center text-2xl font-semibold text-brand-navy">
        Create your staff account
      </h1>
      <SignUp
        routing="hash"
        signInUrl="/admin/sign-in"
        forceRedirectUrl="/admin/accept-invitation"
      />
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Your invitation will be verified before workspace access is activated.
      </p>
    </main>
  );
}
