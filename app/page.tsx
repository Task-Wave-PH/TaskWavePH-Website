import Link from "next/link";
import { ArrowRight, ClipboardList, MessageCircle, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getApplyHref } from "@/features/applications/tracking";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const applyHref = getApplyHref(await searchParams);
  return (
    <>
      <Header applyHref={applyHref} />
      <main id="main-content">
        <section className="border-b bg-secondary/50">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <p className="mb-5 text-sm font-semibold tracking-wide text-primary">
              RECRUITMENT & STAFFING · PHILIPPINES
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Take the next step
              <br className="hidden sm:block" /> in your career.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              TaskWavePH connects people with BPO and staffing opportunities in
              the Philippines. Tell us about your experience and the work you’re
              looking for.
            </p>
            <Link
              href={applyHref}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Apply Now <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              We’re preparing to welcome applications. Explore the form ahead of
              opening.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-primary">
                ABOUT TASKWAVEPH
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                People. Opportunities. A fresh start.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              TaskWavePH is a Philippine BPO, staffing, and recruitment
              initiative. Our application process helps the recruitment team
              understand your interests, skills, and availability.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Tell us what fits",
                text: "Share the role you’re interested in and your experience.",
              },
              {
                icon: ClipboardList,
                title: "A simple application",
                text: "Prepare your contact details and complete one form on your phone.",
              },
              {
                icon: MessageCircle,
                title: "Recruitment review",
                text: "When applications open, our team will review profiles against available opportunities.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border p-6">
                <Icon className="mb-5 size-6 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t bg-secondary/50">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <h2 className="text-2xl font-semibold">
                What’s your next opportunity?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start by exploring our application form.
              </p>
            </div>
            <Link
              href={applyHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Apply Now <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
