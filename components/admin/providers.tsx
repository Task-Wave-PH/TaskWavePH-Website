"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
function Backend({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  );
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" afterSignOutUrl="/admin/sign-in">
      <TooltipProvider>
        <Backend>{children}</Backend>
      </TooltipProvider>
    </ClerkProvider>
  );
}
