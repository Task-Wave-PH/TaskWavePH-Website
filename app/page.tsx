import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ChartPie,
  ClipboardList,
  CodeXml,
  Globe2,
  Headset,
  Megaphone,
  Send,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplyLink } from "@/components/layout/apply-link";
import { getApplyHref } from "@/features/applications/tracking";
import { getSiteUrl } from "@/lib/env";

const description =
  "Explore BPO and business support opportunities with TaskWavePH, a Philippine-based outsourcing agency connecting skilled people with global business needs.";

export const metadata: Metadata = {
  title: "TaskWavePH | Make your next move",
  description,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: "TaskWavePH | Make your next move",
    description,
    url: getSiteUrl(),
    type: "website",
    locale: "en_PH",
    siteName: "TaskWavePH",
  },
  twitter: {
    card: "summary",
    title: "TaskWavePH | Make your next move",
    description,
  },
};

const themes = [
  { icon: Users, title: "Reliable Teams" },
  { icon: Settings2, title: "Efficient Processes" },
  { icon: ChartNoAxesCombined, title: "Scalable Solutions" },
  { icon: Globe2, title: "Global Impact" },
];

const areas = [
  {
    icon: Headset,
    title: "Customer Support",
    description:
      "Help people find answers and make every customer conversation count.",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    description:
      "Connect brands with their audiences through content, campaigns, and digital channels.",
  },
  {
    icon: CodeXml,
    title: "Web Development",
    description:
      "Build and improve the websites and digital experiences businesses rely on.",
  },
  {
    icon: UserRound,
    title: "Virtual Assistance",
    description:
      "Keep everyday tasks organized so teams can focus on their priorities.",
  },
  {
    icon: ChartPie,
    title: "Admin & Business Support",
    description:
      "Support the processes, coordination, and details that keep businesses moving.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Lead Generation & Sales Support",
    description:
      "Help businesses discover prospects, build relationships, and support sales activities.",
  },
];

const steps = [
  {
    icon: Users,
    title: "Explore your fit",
    description:
      "Get to know our areas of work and think about where your skills can contribute.",
  },
  {
    icon: ClipboardList,
    title: "Prepare your details",
    description:
      "Have your contact details, experience, and availability ready. A resume link is optional.",
  },
  {
    icon: Send,
    title: "Apply when we open",
    description:
      "Once applications open, share your profile for review against available opportunities.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const applyHref = getApplyHref(await searchParams);
  return (
    <>
      <Header applyHref={applyHref} landingNavigation />
      <main id="main-content">
        <div className="bg-secondary px-5 py-3 text-center text-xs leading-relaxed text-brand-navy sm:text-sm">
          Applications are opening soon. You can preview the form.
        </div>

        <section
          aria-labelledby="hero-title"
          className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div>
              <h1
                id="hero-title"
                className="text-[2.5rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[4rem]"
              >
                Make your <span className="block text-primary">next move.</span>
              </h1>
              <p className="mt-6 max-w-[440px] text-base leading-relaxed text-muted-foreground sm:text-lg">
                Explore BPO and business support opportunities with TaskWavePH
                in the Philippines.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <ApplyLink href={applyHref} />
                <a
                  href="#about"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm text-sm font-medium text-brand-navy hover:text-primary"
                >
                  Meet TaskWavePH{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <figure className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] rounded-tr-[80px] bg-[#eff7ff] px-6 py-10 sm:px-10 lg:min-h-[360px] lg:rounded-tr-[110px]">
              <div className="relative aspect-[2/1] w-full max-w-[390px] overflow-hidden">
                <Image
                  src="/logo/taskwaveph-symbol.png"
                  alt="TaskWavePH TW wave monogram"
                  fill
                  preload
                  sizes="(max-width: 639px) calc(100vw - 88px), (max-width: 1023px) 390px, 390px"
                  className="object-cover object-center"
                />
              </div>
              <div
                aria-hidden="true"
                className="my-7 h-1 w-12 rounded-full bg-brand-cyan"
              />
              <figcaption className="text-center text-sm font-medium text-brand-navy sm:text-base">
                Outsource. Optimize. Grow.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-labelledby="why-title"
          className="mx-auto max-w-[1180px] px-5 sm:px-8"
        >
          <h2 id="why-title" className="sr-only">
            Why TaskWavePH
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 border-y py-8 sm:grid-cols-4 sm:py-10">
            {themes.map(({ icon: Icon, title }) => (
              <li
                key={title}
                className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-3"
              >
                <Icon
                  className="size-6 shrink-0 text-primary"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-brand-navy sm:text-sm">
                  {title}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="areas-of-work"
          aria-labelledby="areas-title"
          className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="max-w-xl">
            <h2
              id="areas-title"
              className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Where your skills can fit.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Our work supports businesses in these areas. Openings vary;
              explore what matches your interests and experience.
            </p>
          </div>
          <ul className="mt-10 grid gap-x-14 md:grid-cols-2">
            {areas.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-5 border-b py-6 first:pt-0 md:[&:nth-child(2)]:pt-0"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon
                    className="size-6 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h3 className="text-base font-semibold leading-snug sm:text-lg">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="process-title"
          className="bg-secondary"
        >
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20">
            <h2
              id="process-title"
              className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Your next step, made simple.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              A little preparation now makes it easier to share your story when
              applications open.
            </p>
            <ol className="mt-10 grid gap-9 md:grid-cols-3 md:gap-10">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <li key={title}>
                  <div className="mb-5 flex items-center gap-4">
                    <span className="text-sm font-semibold text-primary">
                      0{index + 1}
                    </span>
                    <span aria-hidden="true" className="h-px w-12 bg-input" />
                    <Icon
                      className="size-5 text-brand-navy"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-10 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
              Our recruitment team will contact you if your profile matches an
              available opportunity.
            </p>
          </div>
        </section>

        <section
          id="about"
          aria-labelledby="about-title"
          className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16"
        >
          <div>
            <h2
              id="about-title"
              className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              People behind the progress.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              TaskWavePH is a Philippine-based outsourcing and business support
              agency that helps global businesses streamline operations, reduce
              costs, and scale faster.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We bring together skilled professionals and efficient processes to
              deliver support, marketing, and web solutions.
            </p>
          </div>
          <div className="border-l-4 border-brand-cyan bg-secondary px-6 py-8 sm:px-8 sm:py-10">
            <p className="text-2xl font-semibold leading-snug text-brand-navy sm:text-3xl">
              Your Partner in Outsourcing.
              <br />
              <span className="text-primary">Your Advantage in Growth.</span>
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              We handle the tasks. You focus on growth.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <div className="flex flex-col items-start gap-7 rounded-2xl bg-primary px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between md:gap-10">
            <div>
              <h2
                id="cta-title"
                className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl"
              >
                A new chapter starts with you.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white sm:text-base">
                Get familiar with the application form and prepare for what’s
                next.
              </p>
            </div>
            <ApplyLink href={applyHref} light />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
