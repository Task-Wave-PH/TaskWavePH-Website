"use client";
import { createContext, useContext, useState, useRef } from "react";
import { jobSlugBase, numberedJobSlug } from "@/features/jobs/urls";
import { previewJobs } from "@/features/jobs/preview-data";
import type { JobInput, JobStatus, JobView } from "@/features/jobs/schema";
type State = {
  jobs: JobView[];
  save: (data: JobInput, id?: string) => string;
  reset: () => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: JobStatus) => void;
};
const Context = createContext<State | null>(null);
export function PreviewJobsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobs, setJobs] = useState(previewJobs);
  const counters = useRef(
    new Map(
      previewJobs()
        .filter((j) => j.slug)
        .map((j) => [j.slug!.slice(0, -3), 1]),
    ),
  );
  return (
    <Context.Provider
      value={{
        jobs,
        reset: () => {
          setJobs(previewJobs());
          counters.current = new Map(
            previewJobs()
              .filter((j) => j.slug)
              .map((j) => [j.slug!.slice(0, -3), 1]),
          );
        },
        remove: (id) => setJobs((rows) => rows.filter((row) => row._id !== id)),
        save: (data, id) => {
          const saved = id ?? `sample-job-${crypto.randomUUID()}`;
          setJobs((rows) =>
            id
              ? rows.map((row) =>
                  row._id === id
                    ? { ...row, ...data, updatedAt: Date.now() }
                    : row,
                )
              : [
                  {
                    ...data,
                    _id: saved,
                    status: "Draft",
                    updatedAt: Date.now(),
                  },
                  ...rows,
                ],
          );
          return saved;
        },
        setStatus: (id, status) => {
          const job = jobs.find((row) => row._id === id);
          let slug = job?.slug;
          if (job && !slug && status === "Published") {
            const base = jobSlugBase(job.title, job.publishedAt ?? Date.now());
            const sequence = (counters.current.get(base) ?? 0) + 1;
            counters.current.set(base, sequence);
            slug = numberedJobSlug(base, sequence);
          }
          setJobs((rows) =>
            rows.map((row) =>
              row._id === id
                ? {
                    ...row,
                    status,
                    ...(slug ? { slug } : {}),
                    updatedAt: Date.now(),
                    ...(status === "Published" && row.status !== "Published"
                      ? { publishedAt: Date.now() }
                      : {}),
                  }
                : row,
            ),
          );
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePreviewJobs() {
  const state = useContext(Context);
  if (!state) throw Error("Preview jobs provider required");
  return state;
}
