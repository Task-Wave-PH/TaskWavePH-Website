import {
  serviceAreas,
  workArrangements,
  employmentTypes,
  type JobView,
} from "./schema";
export function previewJobs(): JobView[] {
  return Array.from({ length: 16 }, (_, i) => ({
    _id: `sample-job-${String(i + 1).padStart(3, "0")}`,
    title: `Sample ${serviceAreas[i % serviceAreas.length]} Role ${i + 1}`,
    serviceArea: serviceAreas[i % serviceAreas.length],
    location: "Sample location, Philippines",
    arrangement: workArrangements[i % workArrangements.length],
    employmentType: employmentTypes[i % employmentTypes.length],
    description:
      "Synthetic preview role only. This posting demonstrates how approved role descriptions appear to applicants; it is not an actual vacancy.",
    responsibilities:
      "Coordinate the sample team’s tasks.\nMaintain clear communication and organized work.",
    requirements:
      "Relevant skills for this sample role.\nClear communication and attention to detail.",
    salary: i % 2 === 0 ? "Sample salary information only" : "",
    status: i < 14 ? "Published" : i === 14 ? "Draft" : "Closed",
    publishedAt: i < 14 ? Date.UTC(2026, 8, 30, 0, i) : undefined,
    updatedAt: Date.UTC(2026, 8, 30, 0, i),
  }));
}
