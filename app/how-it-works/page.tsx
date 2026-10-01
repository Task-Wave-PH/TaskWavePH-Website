import { ContentPage } from "@/components/layout/content-page";
import { Card, CardContent } from "@/components/ui/card";
import type { TrackingQuery } from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import { steps } from "@/lib/brand-content";

export const metadata = pageMetadata(
  "How It Works",
  "Share your business needs, discuss suitable outsourcing support, and agree on next steps with TaskWavePH.",
  "/how-it-works",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TrackingQuery>;
}) {
  const query = await searchParams;
  return (
    <ContentPage
      query={query}
      eyebrow="Working together"
      title="Business support starts with a conversation."
      description="Tell us what your team needs. Together, we can explore how TaskWavePH’s talent and services could support your operations."
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li key={title}>
            <Card className="h-full">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="text-sm font-semibold text-primary"
                  >
                    0{index + 1}
                  </span>
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <section className="max-w-3xl">
        <h2 className="text-2xl font-semibold">
          What to include in your enquiry
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Share your company’s priorities, the services you are interested in,
          and the work you would like support with. Your enquiry gives us a
          starting point for discussing your needs.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">
          Define the work together
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The scope, responsibilities, and working arrangements need to be
          discussed and agreed before collaboration begins. Submitting an
          enquiry does not create a service agreement.
        </p>
      </section>
    </ContentPage>
  );
}
