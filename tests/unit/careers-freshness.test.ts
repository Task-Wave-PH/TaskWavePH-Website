import { afterEach, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const { query, client } = vi.hoisted(() => {
  const query = vi.fn();
  return { query, client: vi.fn(() => ({ query })) };
});
vi.mock("server-only", () => ({}));
vi.mock("../../features/jobs/server", () => ({ publicJobsClient: client }));
vi.mock("../../lib/dev-preview", () => ({ isLocalPreview: async () => false }));
import Page from "../../app/careers/page";
import { JobList } from "../../components/jobs/job-list";

afterEach(() => vi.clearAllMocks());

it("reads fresh published results on every Careers render without opting into the first-page cache", async () => {
  const job = { _id: "published-job", title: "Published role" };
  query.mockResolvedValueOnce({ page: [job], isDone: true });
  query.mockResolvedValueOnce({ page: [], isDone: true });
  const renderedJobs = async () => {
    const page = await Page({ searchParams: Promise.resolve({}) });
    const children = page.props.children as ReactElement<{
      jobs: unknown[];
    }>[];
    return children.find((child) => child.type === JobList)?.props.jobs;
  };
  expect(await renderedJobs()).toEqual([job]);
  // Simulate the backend result after staff withdraws the only published job.
  expect(await renderedJobs()).toEqual([]);
  expect(client.mock.calls).toEqual([[], []]);
  expect(query).toHaveBeenCalledTimes(2);
});
