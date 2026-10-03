"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { validateQrPng } from "@/features/settings/png";
import { api } from "@/convex/_generated/api";
import { StaffGate, DashboardShell } from "./dashboard";
import { AccessLoading } from "./access-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
  defaultQrSettings,
  qrSettingsSchema,
  type QrSettings,
} from "@/features/settings/qr";
import { campaignChannels } from "@/features/applications/campaigns";
import { adminOperation } from "@/features/admin/operation-feedback";
function Choice({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  const id = `qr-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
      >
        <SelectTrigger id={id} className="min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function SettingsPage() {
  return (
    <StaffGate>
      <OwnerSettings />
    </StaffGate>
  );
}
function OwnerSettings() {
  const current = useQuery(api.staffManagement.current);
  if (!current) return <AccessLoading message="Checking owner access…" />;
  return (
    <DashboardShell sectionTitle="Settings">
      {current.role === "Owner" ? (
        <LiveSettings />
      ) : (
        <Card>
          <CardContent className="space-y-4 py-6">
            <h1 className="text-2xl font-semibold">Owner access required</h1>
            <p>Only owners can change workspace settings.</p>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
function LiveSettings() {
  const saved = useQuery(api.settings.read);
  const save = useMutation(api.settings.save);
  const saveLogo = useAction(api.qrLogos.save);
  if (!saved) return <AccessLoading message="Loading settings…" />;
  return (
    <SettingsEditor
      saved={saved}
      onSave={({ png, ...args }) =>
        png ? saveLogo({ ...args, png }) : save(args)
      }
    />
  );
}
export function PreviewSettings() {
  const [saved, setSaved] = useState({ value: defaultQrSettings, revision: 0 });
  return (
    <DashboardShell preview sectionTitle="Settings">
      <SettingsEditor
        preview
        saved={saved}
        onSave={async (v) => {
          setSaved({ value: v.value, revision: saved.revision + 1 });
          return { saved: true, revision: saved.revision + 1 };
        }}
      />
    </DashboardShell>
  );
}
function SettingsEditor({
  saved,
  onSave,
  preview = false,
}: {
  saved: { value: QrSettings; revision: number };
  onSave: (args: {
    value: QrSettings;
    expectedRevision: number;
    png?: ArrayBuffer;
  }) => Promise<{ saved: boolean; revision: number }>;
  preview?: boolean;
}) {
  const [value, setValue] = useState(saved.value);
  const [revision, setRevision] = useState(saved.revision);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draftLogo, setDraftLogo] = useState<{
    png: ArrayBuffer;
    url: string;
  } | null>(null);
  const [savedPreviewLogo, setSavedPreviewLogo] = useState<string | null>(null);
  async function chooseLogo(file: File | undefined) {
    if (!file) return;
    setError("");
    setGenerating(true);
    try {
      if (file.type !== "image/png" || file.size > 1024 * 1024)
        throw new Error("INVALID_PNG");
      const png = await file.arrayBuffer();
      if (!validateQrPng(new Uint8Array(png))) throw new Error("INVALID_PNG");
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("INVALID_PNG"));
        reader.onerror = () => reject(new Error("INVALID_PNG"));
        reader.readAsDataURL(file);
      });
      const image = new window.Image();
      image.src = url;
      await image.decode();
      setDraftLogo({ png, url });
      change("logo", "custom");
    } catch {
      setError("Choose a valid static PNG up to 1 MB and 2048 × 2048 pixels.");
    } finally {
      setGenerating(false);
    }
  }
  function change<K extends keyof QrSettings>(key: K, next: QrSettings[K]) {
    setValue((v) => ({ ...v, [key]: next }));
    setDirty(true);
    setImage("");
    setError("");
  }
  async function previewQr() {
    setError("");
    if (!qrSettingsSchema.safeParse(value).success) {
      setError("Choose valid dark colors with enough contrast against white.");
      return;
    }
    setGenerating(true);
    try {
      const { createCampaignQr } =
        await import("@/features/applications/campaign-qr");
      const sample = new URL("https://www.taskwaveph.com/careers");
      sample.search = new URLSearchParams({
        source: value.channel,
        campaign: "sample-campaign",
        utm_source: value.channel,
        utm_medium: value.placement,
        utm_campaign: "sample-campaign",
      }).toString();
      setImage(
        await createCampaignQr(
          sample.href,
          value,
          draftLogo?.url ??
            (preview ? (savedPreviewLogo ?? "") : "/api/admin/qr-logo"),
        ),
      );
    } catch {
      setError("Unable to create the preview. Please try again.");
    } finally {
      setGenerating(false);
    }
  }
  async function submit() {
    if (busy) return;
    setError("");
    if (!qrSettingsSchema.safeParse(value).success) {
      setError("Choose valid dark colors with enough contrast against white.");
      return;
    }
    setBusy(true);
    try {
      const result = await adminOperation(
        async () => {
          const result = await onSave({
            value,
            expectedRevision: revision,
            ...(value.logo === "custom" && draftLogo
              ? { png: draftLogo.png }
              : {}),
          });
          if (!result.saved) throw new Error("SETTINGS_THROTTLED");
          return result;
        },
        {
          loading: "Saving settings…",
          success: preview
            ? "Sample settings saved. No database changes were made."
            : "Settings saved.",
          error: "Unable to save settings.",
        },
      );
      setRevision(result.revision);
      if (preview && draftLogo && value.logo === "custom")
        setSavedPreviewLogo(draftLogo.url);
      setDraftLogo(null);
      setDirty(false);
    } catch {
      setError(
        "Unable to save. Your edits are preserved. If another owner changed settings, discard your edits to load the latest version before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Manage QR branding and recruitment campaign defaults.
          {preview
            ? " Local Owner preview only; changes reset on refresh."
            : " Changes apply to new QR downloads, not images already shared."}
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>QR design</CardTitle>
            <CardDescription>
              Keep campaign codes clear, recognizable, and easy to scan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset
              disabled={busy || generating}
              className="min-w-0 space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Choice
                  label="Style"
                  value={value.style}
                  values={["solid", "gradient"]}
                  onChange={(v) => change("style", v as QrSettings["style"])}
                />
                <Choice
                  label="Logo"
                  value={value.logo}
                  values={[
                    "symbol",
                    "wordmark",
                    "none",
                    ...(draftLogo || saved.value.logo === "custom"
                      ? ["custom"]
                      : []),
                  ]}
                  onChange={(v) => change("logo", v as QrSettings["logo"])}
                />
                <Choice
                  label="Logo size"
                  value={String(value.logoSize)}
                  values={["15", "20", "25"]}
                  onChange={(v) =>
                    change("logoSize", Number(v) as QrSettings["logoSize"])
                  }
                />
              </div>
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <Label htmlFor="qr-logo-upload">Upload QR logo</Label>
                <Input
                  id="qr-logo-upload"
                  type="file"
                  accept="image/png"
                  className="min-h-11"
                  onChange={(e) => {
                    void chooseLogo(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                  aria-describedby="qr-logo-upload-help"
                />
                <p
                  id="qr-logo-upload-help"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  Static PNG, up to 1 MB and 2048 × 2048 pixels. A transparent
                  background is recommended. Preview before saving; this changes
                  only the QR logo.
                </p>
                {draftLogo && (
                  <div className="flex items-center gap-3">
                    <Image
                      src={draftLogo.url}
                      alt="Selected QR logo"
                      unoptimized
                      width={64}
                      height={64}
                      className="size-16 rounded-lg border bg-white object-contain p-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Selected locally. Uploads when you save settings.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label>Brand presets</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Navy", "#0A1D3B"],
                    ["Blue", "#0D6EFD"],
                    ["Black", "#000000"],
                  ].map(([label, hex]) => (
                    <Button
                      key={label}
                      variant="outline"
                      type="button"
                      className="min-h-11"
                      onClick={() => change("color", hex)}
                    >
                      <span
                        aria-hidden
                        className="size-3 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    "color",
                    ...(value.style === "gradient" ? ["gradientColor"] : []),
                  ] as ("color" | "gradientColor")[]
                ).map((key) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={`qr-${key}`}>
                      {key === "color" ? "Primary color" : "Gradient end color"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        aria-label={`${key === "color" ? "Primary" : "Gradient end"} color picker`}
                        className="h-11 w-14 shrink-0 cursor-pointer p-1"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(value[key])
                            ? value[key]
                            : "#000000"
                        }
                        onChange={(e) => change(key, e.target.value)}
                      />
                      <Input
                        id={`qr-${key}`}
                        value={value[key]}
                        maxLength={7}
                        className="min-h-11"
                        onChange={(e) => change(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                White background and scan margins stay fixed. Use dark colors
                and scan a sample before printing. Logo sizes are percentages of
                QR width.
              </p>
              <div className="space-y-4 border-t pt-5">
                <h2 className="text-sm font-semibold">Campaign defaults</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Choice
                    label="Default channel"
                    value={value.channel}
                    values={campaignChannels}
                    onChange={(v) =>
                      change("channel", v as QrSettings["channel"])
                    }
                  />
                  <Choice
                    label="Default placement"
                    value={value.placement}
                    values={["social", "paid-social", "qr", "referral"]}
                    onChange={(v) =>
                      change("placement", v as QrSettings["placement"])
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Staff can still choose the channel and placement for each
                  campaign.
                </p>
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
              <Button
                className="min-h-11"
                disabled={busy || generating || !dirty}
                onClick={submit}
              >
                {busy ? "Saving…" : "Save settings"}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={busy || generating}
                onClick={() => {
                  setValue(saved.value);
                  setDraftLogo(null);
                  setRevision(saved.revision);
                  setDirty(false);
                  setImage("");
                  setError("");
                }}
              >
                Discard changes
              </Button>
              <Button
                variant="ghost"
                className="min-h-11"
                disabled={busy || generating}
                onClick={() => {
                  setValue(defaultQrSettings);
                  setDraftLogo(null);
                  setDirty(true);
                  setImage("");
                  setError("");
                }}
              >
                Restore defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>QR preview</CardTitle>
            <CardDescription>Preview your edits before saving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {image ? (
              <Image
                src={image}
                unoptimized
                alt="TaskWavePH sample campaign QR code"
                width={1024}
                height={1024}
                className="aspect-square w-full rounded-xl border bg-white"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Your sample QR will appear here.
              </div>
            )}
            <Button
              variant="outline"
              className="min-h-11 w-full"
              disabled={generating || busy}
              onClick={previewQr}
            >
              {generating ? "Generating…" : "Preview QR"}
            </Button>
            {image && (
              <a
                href={image}
                download="taskwaveph-sample-qr.png"
                className={buttonVariants({
                  variant: "outline",
                  className: "min-h-11 w-full",
                })}
              >
                Download sample
              </a>
            )}
          </CardContent>
        </Card>
      </div>
      {!preview && (
        <Card>
          <CardHeader>
            <CardTitle>Owner management</CardTitle>
            <CardDescription>
              Manage approved staff and review workspace changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/users"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11",
              })}
            >
              Manage users
            </Link>
            <Link
              href="/admin/activity"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11",
              })}
            >
              View activity
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
