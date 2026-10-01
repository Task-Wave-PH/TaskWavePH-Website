"use client";
import { UserButton } from "@clerk/nextjs";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

// Adapted from shadcn dashboard-01 for the approved staff workspace.
export function AppSidebar({
  children,
  preview = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
}) {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader className="border-b px-5 py-6">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          {preview ? (
            <span
              className="size-8 rounded-full bg-primary/15"
              aria-hidden="true"
            />
          ) : (
            <UserButton />
          )}
          <span className="text-sm font-medium">
            {preview ? "UI preview" : "Staff account"}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
