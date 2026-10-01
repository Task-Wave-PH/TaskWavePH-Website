"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePreviewJobs } from "@/components/jobs/preview-provider";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { UserRound, ChevronsUpDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
function AccountMenu({
  name,
  email,
  avatar,
  preview,
  onLogout,
}: {
  name: string;
  email: string;
  avatar?: string;
  preview?: boolean;
  onLogout: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={`${name} account menu`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="rounded-xl"
              />
            ) : (
              <UserRound className="size-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate">{name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={busy}
              className="min-h-11"
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await onLogout();
                } catch {
                  setError("Unable to sign out. Please try again.");
                  setBusy(false);
                }
              }}
            >
              <LogOut className="size-4" />
              {busy ? "Signing out…" : preview ? "Exit preview" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
function StaffAccount() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <AccountMenu
      name={user?.fullName || user?.username || "Staff member"}
      email={
        user?.primaryEmailAddress?.emailAddress ?? "Approved staff account"
      }
      avatar={user?.imageUrl}
      onLogout={async () => {
        await signOut({ redirectUrl: "/admin/sign-in" });
      }}
    />
  );
}
function PreviewAccount() {
  const router = useRouter();
  const { reset } = usePreviewJobs();
  return (
    <AccountMenu
      name="Sample staff"
      email="Local UI preview · no active sign-in"
      preview
      onLogout={async () => {
        reset();
        router.push("/");
      }}
    />
  );
}
export function AdminAccountMenu({ preview = false }: { preview?: boolean }) {
  return preview ? <PreviewAccount /> : <StaffAccount />;
}
