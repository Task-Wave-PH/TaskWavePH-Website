"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePreviewJobs } from "@/components/jobs/preview-provider";
import { useRef, useState } from "react";
import { LogoutConfirmation } from "./logout-confirmation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
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
  role,
  onLogout,
}: {
  name: string;
  email: string;
  avatar?: string;
  preview?: boolean;
  role?: "Owner" | "Staff";
  onLogout: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
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
            <span className="flex items-center gap-2">
              <span className="min-w-0 truncate text-sm font-medium">
                {name}
              </span>
              {role && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {role}
                </Badge>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-72 max-w-[calc(100vw-2rem)] p-2"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="space-y-2 px-2 py-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">{name}</p>
                {role && <Badge variant="secondary">{role}</Badge>}
              </div>
              <p className="text-xs leading-relaxed font-normal wrap-anywhere text-muted-foreground">
                {email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="min-h-11 gap-3 rounded-lg px-3"
              onClick={() => setConfirm(true)}
            >
              <LogOut className="size-4" />
              {preview ? "Exit preview" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutConfirmation
        open={confirm}
        onOpenChange={setConfirm}
        onLogout={onLogout}
        finalFocus={trigger}
        preview={preview}
      />
    </>
  );
}
function StaffAccount() {
  const { user } = useUser();
  const current = useQuery(api.staffManagement.current);
  const { signOut } = useClerk();
  return (
    <AccountMenu
      name={user?.fullName || user?.username || "Staff member"}
      email={
        user?.primaryEmailAddress?.emailAddress ?? "Approved staff account"
      }
      avatar={user?.imageUrl}
      role={current?.role}
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
      role="Staff"
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
