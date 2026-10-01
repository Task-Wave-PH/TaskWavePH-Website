import { ContentPage } from "@/components/layout/content-page";
import {
  ArrowRight,
  Check,
  ClipboardList,
  MessageSquare,
  Handshake,
} from "lucide-react";
import type { TrackingQuery } from "@/features/applications/tracking";
import { pageMetadata } from "@/lib/page-metadata";
import { steps } from "@/lib/brand-content";

const details = [
  {
    icon: ClipboardList,
    eyebrow: "Start with your priorities",
    heading: "Give us a picture of the work.",
    description:
      "Every business has different responsibilities, customer needs, and day-to-day demands. Your enquiry helps us understand where support could make a difference and which service areas are relevant to your team.",
    checklist: [
      "The tasks or processes you want support with",
      "The services that interest your company",
      "Your current priorities and preferred working arrangements",
    ],
    outcome:
      "A clear starting point for a conversation about your business needs.",
  },
  {
    icon: MessageSquare,
    eyebrow: "Explore the fit together",
    heading: "Connect the needs with suitable support.",
    description:
      "We can discuss how Filipino talent, communication, and organized processes could support your operations. The conversation helps define the work instead of assuming that the same service package fits every company.",
    checklist: [
      "The skills and responsibilities the work calls for",
      "How your team communicates and coordinates tasks",
      "The scope and practical requirements to discuss further",
    ],
    outcome:
      "A shared understanding of possible support and the questions still to resolve.",
  },
  {
    icon: Handshake,
    eyebrow: "Make the next step clear",
    heading: "Agree before moving forward.",
    description:
      "Clear responsibilities and expectations give collaboration a stronger foundation. Scope, working arrangements, availability, and commercial terms need to be discussed and agreed before services begin.",
    checklist: [
      "The agreed work and each team’s responsibilities",
      "Communication, coordination, and working arrangements",
      "Separate service terms and commitments before engagement",
    ],
    outcome:
      "Agreed next steps, with any service commitments handled separately.",
  },
];

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
      <section aria-labelledby="journey-title">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-primary">
            Outsource. Optimize. Grow.
          </p>
          <h2 id="journey-title" className="mt-3 text-3xl font-semibold">
            From your priorities to a shared plan.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Our approach starts with understanding the work. Here is how a
            business enquiry can move the conversation forward.
          </p>
        </div>
        <ol
          aria-label="Business collaboration workflow"
          className="grid gap-6 lg:grid-cols-3 lg:gap-8"
        >
          {steps.map(({ title, description }, index) => (
            <li key={title} className="relative">
              {index < steps.length - 1 && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-24px] left-6 top-12 border-l-2 border-dashed border-primary/25 lg:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-[calc(50%+2rem)] top-6 hidden w-[calc(100%+2rem-4rem)] border-t-2 border-dashed border-primary/25 lg:block"
                  />
                </>
              )}
              <a
                href={`#step-${index + 1}`}
                className="relative grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 rounded-xl lg:flex lg:flex-col lg:items-center lg:text-center"
              >
                <span
                  aria-hidden="true"
                  className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white ring-8 ring-background"
                >
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
                    Explore this step{" "}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ol>
      </section>
      <div className="space-y-10 sm:space-y-14">
        {details.map(
          (
            { icon: Icon, eyebrow, heading, description, checklist, outcome },
            index,
          ) => (
            <section
              id={`step-${index + 1}`}
              key={heading}
              className="grid gap-8 border-t pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
            >
              <div>
                <div className="flex items-center gap-3 text-sm font-medium text-primary">
                  <span className="rounded-full bg-secondary px-3 py-1.5">
                    Step 0{index + 1}
                  </span>
                  {eyebrow}
                </div>
                <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">
                  {heading}
                </h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-6 sm:p-8">
                <Icon aria-hidden="true" className="size-7 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">
                  What we can discuss
                </h3>
                <ul className="mt-5 space-y-4">
                  {checklist.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 leading-relaxed text-muted-foreground"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t pt-5">
                  <p className="text-sm font-semibold text-brand-navy">
                    The intended outcome
                  </p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {outcome}
                  </p>
                </div>
              </div>
            </section>
          ),
        )}
      </div>
      <section className="rounded-2xl border-l-4 border-brand-cyan bg-brand-navy px-6 py-8 text-white sm:px-10">
        <h2 className="text-2xl font-semibold text-white">
          Clear expectations. A stronger foundation.
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/85">
          Reliable teams, efficient processes, and scalable solutions are the
          themes behind TaskWavePH’s work. The right support starts with a clear
          conversation about what your business needs.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/85">
          Submitting an enquiry starts that conversation. It does not create a
          service agreement or guarantee staffing availability.
        </p>
      </section>
    </ContentPage>
  );
}
