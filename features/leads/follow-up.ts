import { z } from "zod";
export const followUpDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "2000-01-01" &&
      value <= "2100-12-31"
    );
  }, "Choose a valid follow-up date between 2000 and 2100.");
export function followUpTimestamp(value: string) {
  return Date.parse(`${value}T00:00:00+08:00`);
}
export function isLeadOverdue(
  lead: { status: string; nextFollowUp?: string },
  today: string,
) {
  return (
    lead.status !== "Closed" && !!lead.nextFollowUp && lead.nextFollowUp < today
  );
}
