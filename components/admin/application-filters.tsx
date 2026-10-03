"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { applicationStatuses } from "@/features/submissions/validation";
import {
  campaignChannels,
  applicationFiltersSchema,
  filterParams,
  monthRange,
  type ApplicationFilters,
} from "@/features/applications/campaigns";
export function ApplicationFilterControls({
  status,
  onChange,
  actions,
  jobs = [],
  sources = [],
  campaigns = [],
  moreJobs,
  loadingJobs = false,
}: {
  status: string;
  onChange: (value: ApplicationFilters, status: string) => void;
  actions?: React.ReactNode;
  jobs?: { _id: string; title: string; status: string }[];
  sources?: string[];
  campaigns?: string[];
  moreJobs?: () => void;
  loadingJobs?: boolean;
}) {
  const [draft, setDraft] = useState<ApplicationFilters>({});
  const [draftStatus, setDraftStatus] = useState(status);
  const [month, setMonth] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState("");
  return (
    <Card className="py-0">
      <CardContent className="p-4 sm:p-5">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const parsed = applicationFiltersSchema.safeParse(
                filterParams({ ...draft, ...(month ? monthRange(month) : {}) }),
              );
              if (!parsed.success) throw new Error("INVALID_FILTERS");
              setError("");
              onChange(parsed.data, draftStatus);
            } catch {
              setError(
                "Check your search terms, month, and date range. For a long email address, enter the full address.",
              );
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="applicant-search">Search applicants</Label>
            <Input
              id="applicant-search"
              type="search"
              className="min-h-11"
              value={draft.search ?? ""}
              maxLength={254}
              placeholder="Application reference, name, or email"
              onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              aria-describedby="applicant-search-help"
            />
            <p
              id="applicant-search-help"
              className="text-xs text-muted-foreground"
            >
              Search across saved applications. Apply filters to update the list
              and exports.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Filter by status</Label>
              <Select
                value={draftStatus || "all"}
                onValueChange={(v) =>
                  setDraftStatus(v === "all" ? "" : String(v))
                }
              >
                <SelectTrigger id="status-filter" className="h-11! w-full">
                  <SelectValue>{draftStatus || "All statuses"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {applicationStatuses.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="filter-month">Submission month</Label>
              <Input
                id="filter-month"
                type="month"
                className="min-h-11 min-w-0"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setDraft({ ...draft, from: undefined, to: undefined });
                }}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="filter-source">Source</Label>
              <Input
                id="filter-source"
                list="known-sources"
                value={draft.source ?? ""}
                maxLength={200}
                placeholder="e.g. linkedin or facebook"
                className="min-h-11"
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              />
              <datalist id="known-sources">
                {[...new Set([...campaignChannels, ...sources])].map(
                  (value) => (
                    <option key={value} value={value} />
                  ),
                )}
              </datalist>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-0 hover:bg-transparent"
            aria-expanded={advanced}
            aria-controls="advanced-application-filters"
            onClick={() => setAdvanced(!advanced)}
          >
            Advanced filters
            <ChevronDown className={advanced ? "rotate-180" : ""} />
          </Button>
          <div
            id="advanced-application-filters"
            hidden={!advanced}
            className="space-y-3 rounded-xl border bg-muted/30 p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="filter-jobId">Job</Label>
                <Select
                  value={draft.jobId || "all"}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      jobId: value === "all" ? undefined : String(value),
                    })
                  }
                >
                  <SelectTrigger id="filter-jobId" className="h-11! w-full">
                    <SelectValue>
                      {jobs.find((job) => job._id === draft.jobId)?.title ||
                        (draft.jobId ? "Selected job" : "All jobs")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job._id} value={job._id}>
                        {job.title} · {job.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {moreJobs && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loadingJobs}
                    className="min-h-11"
                    onClick={moreJobs}
                  >
                    {loadingJobs ? "Loading jobs…" : "Load more jobs"}
                  </Button>
                )}
              </div>
              {(
                [
                  [
                    "campaign",
                    "Campaign",
                    "e.g. customer-support-october-2026",
                  ],
                  ["from", "From date", ""],
                  ["to", "To date", ""],
                ] as const
              ).map(([key, label, placeholder]) => (
                <div key={key} className="grid min-w-0 gap-2">
                  <Label htmlFor={`filter-${key}`}>{label}</Label>
                  <Input
                    id={`filter-${key}`}
                    list={key === "campaign" ? "known-campaigns" : undefined}
                    type={key === "from" || key === "to" ? "date" : "text"}
                    value={draft[key] ?? ""}
                    maxLength={200}
                    placeholder={placeholder}
                    className="min-h-11 min-w-0"
                    onChange={(e) => {
                      if (key === "from" || key === "to") setMonth("");
                      setDraft({ ...draft, [key]: e.target.value });
                    }}
                  />
                </div>
              ))}
            </div>
            <datalist id="known-campaigns">
              {campaigns.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Choose a suggested source or campaign, or enter a custom code. Use
              a month or custom dates. Dates follow Philippine time; source and
              campaign match exact codes.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="min-h-11">
                Apply filters
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  setDraft({});
                  setDraftStatus("");
                  setMonth("");
                  setError("");
                  onChange({}, "");
                }}
              >
                Clear filters
              </Button>
            </div>
            {actions}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
