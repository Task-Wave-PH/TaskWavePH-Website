import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { previewJobs } from "../../features/jobs/preview-data";
const { getJob } = vi.hoisted(() => ({ getJob: vi.fn() }));
vi.mock("../../features/jobs/server", () => ({ getPublishedJob: getJob }));
vi.mock("../../components/application/application-page", () => ({
  ApplicationPage: () => null,
}));
vi.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import Apply from "../../app/apply/page";
import SlugApply, { generateMetadata } from "../../app/apply/[slug]/page";
import Details from "../../app/careers/[jobId]/page";
afterEach(() => {
  getJob.mockReset();
  vi.unstubAllEnvs();
});
it("redirects old application and role URLs with only allowed attribution", async () => {
  const job = previewJobs()[0];
  getJob.mockResolvedValue({ state: "ready", job });
  const searchParams = Promise.resolve({
    jobId: job._id,
    source: "linkedin",
    campaign: "october",
    email: "private@example.invalid",
  });
  await expect(Apply({ searchParams })).rejects.toThrow(
    `REDIRECT:/apply/${job.slug}?source=linkedin&campaign=october`,
  );
  await expect(
    Details({ params: Promise.resolve({ jobId: job._id }), searchParams }),
  ).rejects.toThrow(
    `REDIRECT:/careers/${job.slug}?source=linkedin&campaign=october`,
  );
});
it("role applications use clean noindex metadata and reject unknown or ID path aliases", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.taskwaveph.com");
  const job = previewJobs()[0];
  getJob.mockResolvedValue({ state: "ready", job });
  const props = {
    params: Promise.resolve({ slug: job.slug! }),
    searchParams: Promise.resolve({ utm_source: "linkedin" }),
  };
  const meta = await generateMetadata(props);
  expect(meta.robots).toEqual({ index: false, follow: false });
  expect(meta.alternates?.canonical).toBe(
    `https://www.taskwaveph.com/apply/${job.slug}`,
  );
  await expect(
    SlugApply({ ...props, params: Promise.resolve({ slug: job._id }) }),
  ).rejects.toThrow("NOT_FOUND");
  getJob.mockResolvedValue({ state: "ready", job: null });
  await expect(SlugApply(props)).rejects.toThrow("NOT_FOUND");
});
