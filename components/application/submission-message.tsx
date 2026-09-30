import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export function SubmissionMessage() {
  return (
    <Alert role="status" className="border-primary/30 bg-primary/5">
      <CheckCircle2 aria-hidden="true" />
      <AlertTitle>Application details validated</AlertTitle>
      <AlertDescription>
        Your entries passed the form checks. Your application has not been
        submitted. Please return when applications open.
      </AlertDescription>
    </Alert>
  );
}
