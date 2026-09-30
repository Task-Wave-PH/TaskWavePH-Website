import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplicationForm } from "@/components/application/application-form";
import { Card, CardContent } from "@/components/ui/card";
import { getApplyHref, getTracking } from "@/features/applications/tracking";

export const metadata: Metadata = {
  title: "Apply",
  description: "Prepare your TaskWavePH recruitment application.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <>
      <Header applyHref={getApplyHref(query)} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8"
      >
        <p className="text-sm font-semibold text-primary">YOUR NEXT STEP</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Apply to TaskWavePH
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Tell us a little about yourself. Fields marked optional can be left
          blank.
        </p>
        <div className="my-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
          Applications are not open yet. You can check your entries here, but
          your information will not be sent or saved.
        </div>
        <Card>
          <CardContent className="p-5 sm:p-8">
            <ApplicationForm tracking={getTracking(query)} />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
