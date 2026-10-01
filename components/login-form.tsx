import { SignIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Adapted from shadcn login-03; Clerk handles authentication and recovery.
export function LoginForm() {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-semibold text-brand-navy">Welcome back</h1>
        <CardDescription>
          Sign in to the TaskWavePH staff workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center px-2 pb-6 sm:px-6">
        <SignIn
          routing="hash"
          forceRedirectUrl="/admin"
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
              card: "w-full bg-transparent shadow-none p-0",
              header: "hidden",
              footerAction: "hidden",
            },
            variables: {
              colorPrimary: "#0D6EFD",
              fontFamily: "var(--font-poppins)",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
