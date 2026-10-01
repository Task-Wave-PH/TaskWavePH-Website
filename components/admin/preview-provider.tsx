"use client";
import { createContext, useContext, useState } from "react";
import { previewApplicants } from "@/features/applications/preview-data";
import type { ApplicantView } from "@/features/applications/admin-types";
import { previewLeads, type LeadView } from "@/features/leads/admin-types";
type PreviewState = {
  records: ApplicantView[];
  leads: LeadView[];
  updateLead: (id: string, status: LeadView["status"], notes: string) => void;
  prioritizeLead: (id: string, priority: boolean) => void;
  removeLead: (id: string) => void;
  update: (id: string, status: ApplicantView["status"], notes: string) => void;
  remove: (id: string) => void;
};
const Context = createContext<PreviewState | null>(null);
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState(previewApplicants);
  const [leads, setLeads] = useState(previewLeads);
  return (
    <Context.Provider
      value={{
        records,
        leads,
        updateLead: (id, status, notes) =>
          setLeads((rows) =>
            rows.map((row) =>
              row._id === id
                ? { ...row, status, notes: notes.trim().slice(0, 2000) }
                : row,
            ),
          ),
        prioritizeLead: (id, priority) =>
          setLeads((rows) =>
            rows.map((row) => (row._id === id ? { ...row, priority } : row)),
          ),
        removeLead: (id) =>
          setLeads((rows) => rows.filter((row) => row._id !== id)),
        update: (id, status, notes) =>
          setRecords((rows) =>
            rows.map((row) =>
              row._id === id
                ? { ...row, status, notes: notes.trim().slice(0, 2000) }
                : row,
            ),
          ),
        remove: (id) =>
          setRecords((rows) => rows.filter((row) => row._id !== id)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePreviewApplicants() {
  const state = useContext(Context);
  if (!state) throw new Error("Preview provider required");
  return state;
}

export const usePreviewLeads = usePreviewApplicants;
