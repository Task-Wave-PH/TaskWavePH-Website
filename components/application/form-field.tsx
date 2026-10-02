import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  optional = false,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <Label htmlFor={id} className="flex-wrap leading-snug">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </Label>
      {children}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
