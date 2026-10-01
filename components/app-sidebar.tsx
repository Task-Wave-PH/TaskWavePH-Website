"use client";
import { AdminAccountMenu } from "@/components/admin/account-menu";
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
      <SidebarHeader className="px-4 py-4">
        <BrandLogo className="w-[160px] sm:w-[160px]" />
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter className="border-t p-3">
        <AdminAccountMenu preview={preview} />
      </SidebarFooter>
    </Sidebar>
  );
}
