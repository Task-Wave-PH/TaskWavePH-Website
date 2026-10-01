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
export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader className="border-b px-5 py-6">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-sm font-medium">Staff account</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
