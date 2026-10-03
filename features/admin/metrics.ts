import { isLeadOverdue } from "../leads/follow-up";
export const DAY = 86_400_000;
const MANILA_OFFSET = 8 * 3_600_000;
export const manilaDay = (timestamp: number) =>
  Math.floor((timestamp + MANILA_OFFSET) / DAY);
export const dayStart = (day: number) => day * DAY - MANILA_OFFSET;
export const dateKey = (day: number) =>
  new Date(day * DAY).toISOString().slice(0, 10);
export const formatAdminDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(timestamp);
export type StatusCount = { status: string; count: number };
export type OverviewData = {
  ready: boolean;
  applications: StatusCount[];
  leads: StatusCount[];
  jobs: StatusCount[];
  priorityLeads: number;
  overdueLeads: number;
  activity: { date: string; applications: number; leads: number }[];
  recent: { id: string; action: string; timestamp: number }[];
};
export const total = (counts: StatusCount[]) =>
  counts.reduce((sum, row) => sum + row.count, 0);
export const countStatus = (counts: StatusCount[], status: string) =>
  counts.find((row) => row.status === status)?.count ?? 0;
export function previewOverview(
  applications: { status: string; submittedAt: number }[],
  leads: {
    status: string;
    submittedAt: number;
    priority?: boolean;
    nextFollowUp?: string;
  }[],
  jobs: { status: string }[],
  days: 7 | 30 | 90,
  today: number,
): OverviewData {
  const counts = (rows: { status: string }[], statuses: string[]) =>
    statuses.map((status) => ({
      status,
      count: rows.filter((r) => r.status === status).length,
    }));
  const buckets = (rows: { submittedAt: number }[]) => {
    const map = new Map<number, number>();
    for (const row of rows) {
      const day = manilaDay(row.submittedAt);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return map;
  };
  const apps = buckets(applications),
    enquiries = buckets(leads);
  return {
    ready: true,
    applications: counts(applications, [
      "New",
      "Reviewed",
      "Shortlisted",
      "Closed",
    ]),
    leads: counts(leads, ["New", "Contacted", "Closed"]),
    jobs: counts(jobs, ["Draft", "Published", "Closed", "Archived"]),
    priorityLeads: leads.filter((r) => r.priority).length,
    overdueLeads: leads.filter((r) => isLeadOverdue(r, dateKey(today))).length,
    activity: Array.from({ length: days }, (_, i) => {
      const day = today - days + i + 1;
      return {
        date: dateKey(day),
        applications: apps.get(day) ?? 0,
        leads: enquiries.get(day) ?? 0,
      };
    }),
    recent: [],
  };
}
