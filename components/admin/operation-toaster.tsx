"use client";

import { Toaster } from "@/components/ui/sonner";

export function OperationToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans border-border shadow-lg",
          title: "text-brand-navy",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
