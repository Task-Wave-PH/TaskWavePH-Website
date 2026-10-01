import type { Doc } from "@/convex/_generated/dataModel";
export type ApplicantView = {
  _id: string;
  reference: string;
  submittedAt: number;
  consentVersion: string;
  status: Doc<"applications">["status"];
  notes: string;
  data: Doc<"applications">["data"];
  resumeFile?: { name: string; size: number };
};
