"use client";
import { createContext, useContext, useState } from "react";
import { previewJobs } from "@/features/jobs/preview-data";
import type { JobInput, JobStatus, JobView } from "@/features/jobs/schema";
type State = {
  jobs: JobView[];
  save: (data: JobInput, id?: string) => string;
  setStatus: (id: string, status: JobStatus) => void;
};
const Context = createContext<State | null>(null);
export function PreviewJobsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobs, setJobs] = useState(previewJobs);
  return (
    <Context.Provider
      value={{
        jobs,
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
        setStatus: (id, status) =>
          setJobs((rows) =>
            rows.map((row) =>
              row._id === id
                ? {
                    ...row,
                    status,
                    updatedAt: Date.now(),
                    ...(status === "Published" && row.status !== "Published"
                      ? { publishedAt: Date.now() }
                      : {}),
                  }
                : row,
            ),
          ),
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
