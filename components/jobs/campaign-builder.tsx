"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { defaultQrSettings, type QrSettings } from "@/features/settings/qr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  campaignChannels,
  campaignSchema,
  campaignLink,
} from "@/features/applications/campaigns";
import type { JobView } from "@/features/jobs/schema";
export function CampaignBuilder({
  job,
  preview = false,
}: {
  job: JobView;
  preview?: boolean;
}) {
  return preview ? (
    <CampaignControls job={job} preview settings={defaultQrSettings} />
  ) : (
    <LiveCampaignControls job={job} />
  );
}
function LiveCampaignControls({ job }: { job: JobView }) {
  const saved = useQuery(api.settings.read);
  if (!saved)
    return (
      <Button variant="outline" disabled className="min-h-11">
        Loading campaign tools…
      </Button>
    );
  return <CampaignControls job={job} settings={saved.value} />;
}
export function CampaignControls({
  job,
  preview = false,
  settings,
  customLogoUrl,
}: {
  job?: JobView;
  customLogoUrl?: string;
  preview?: boolean;
  settings: QrSettings;
}) {
  const [source, setSource] = useState<(typeof campaignChannels)[number]>(
    settings.channel,
  );
  const [medium, setMedium] = useState<
    "social" | "paid-social" | "qr" | "referral"
  >(settings.placement);
  const [campaign, setCampaign] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    setError("");
    setLink("");
    const values = campaignSchema.safeParse({ source, medium, campaign });
    if (!values.success) {
      setError(
        "Enter a campaign name using 2–100 lowercase letters, numbers, and single hyphens.",
      );
      return;
    }
    try {
      setLink(
        campaignLink(
          preview
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "",
          job?._id,
          values.data,
          preview,
        ),
      );
    } catch {
      setError(
        "Unable to generate a link. Check the public website URL configuration.",
      );
    }
  }
  async function downloadQr() {
    if (!link || busy) return;
    setBusy(true);
    try {
      const { createCampaignQr } =
        await import("@/features/applications/campaign-qr");
      const url = await createCampaignQr(link, settings, customLogoUrl);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskwaveph-${source}-${campaign.trim()}-qr.png`;
      a.click();
      toast.success("QR download started.", {
        description: preview ? "Sample preview link only." : undefined,
      });
    } catch {
      toast.error("Unable to generate the QR code. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function resetLink() {
    setLink("");
    setError("");
  }
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 self-start"
          />
        }
      >
        {job ? "Campaign link & QR" : "Create event campaign & QR"}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="border-b pb-5 pr-10">
          <DialogTitle>Recruitment campaign link</DialogTitle>
          <DialogDescription>
            {job
              ? "Share this published role on social media or print a QR code. Applications retain the source and campaign. Links stop accepting applications if the role closes."
              : "Create a link to the general application form for an event or recruitment campaign. Submitted applications retain your campaign code."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-5">
          {preview && (
            <p className="text-sm text-muted-foreground">
              Preview only: links open sample applications and never create real
              applications.
            </p>
          )}
          <fieldset className="min-w-0 space-y-5 rounded-xl border bg-muted/20 p-4 sm:p-5">
            <legend className="px-2 text-sm font-semibold">
              Campaign details
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaign-source">Channel</Label>
                <Select
                  value={source}
                  onValueChange={(v) => {
                    setSource(v as typeof source);
                    resetLink();
                  }}
                >
                  <SelectTrigger id="campaign-source" className="h-11! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignChannels.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-medium">Placement</Label>
                <Select
                  value={medium}
                  onValueChange={(v) => {
                    setMedium(v as typeof medium);
                    resetLink();
                  }}
                >
                  <SelectTrigger id="campaign-medium" className="h-11! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["social", "paid-social", "qr", "referral"].map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="campaign-name">Campaign name</Label>
                <Input
                  id="campaign-name"
                  className="min-h-11"
                  value={campaign}
                  maxLength={100}
                  placeholder={
                    job ? "customer-support-october-2026" : "com-sayahan-2026"
                  }
                  onChange={(e) => {
                    setCampaign(e.target.value);
                    resetLink();
                  }}
                  aria-describedby="campaign-help"
                />
              </div>
            </div>
            <p
              id="campaign-help"
              className="text-sm leading-relaxed text-muted-foreground"
            >
              Use a campaign code, never a person’s name or contact details. For
              print, choose QR as the placement. Keep the same campaign name
              across channels to compare results.
            </p>
            <Button
              type="button"
              className="min-h-11 w-full sm:w-auto"
              onClick={generate}
            >
              Create campaign link
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </fieldset>
          {link && (
            <section
              aria-label="Share your campaign"
              className="min-w-0 space-y-4 rounded-xl border p-4 sm:p-5"
            >
              <h3 className="text-sm font-semibold">Share your campaign</h3>
              <div className="grid gap-2">
                <Label htmlFor="campaign-url">Shareable URL</Label>
                <Input
                  id="campaign-url"
                  readOnly
                  value={link}
                  className="min-h-11"
                />
              </div>
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link);
                      toast.success("Campaign link copied.");
                    } catch {
                      toast.error(
                        "Unable to copy. Select and copy the URL above.",
                      );
                    }
                  }}
                >
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  onClick={downloadQr}
                >
                  {busy ? "Generating QR…" : "Download QR"}
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Test the URL and scan the downloaded QR before sharing.
                {job ? (
                  <>
                    {" "}
                    Job ID: <span className="break-all">{job._id}</span>
                  </>
                ) : (
                  " In Applications, open Advanced filters and enter this campaign code to review and export its submissions. This does not count scans or clicks."
                )}
              </p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
