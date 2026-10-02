import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Adapted from shadcn login-03; Clerk handles authentication and recovery.
export function LoginForm({ preview = false }: { preview?: boolean }) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-semibold text-brand-navy">Welcome back</h1>
        <CardDescription>
          Sign in to the TaskWavePH staff workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 justify-center px-5 pb-6 sm:px-6">
        {preview ? (
          <div className="w-full space-y-5">
            <div className="space-y-2">
              <Label htmlFor="preview-email">Email address</Label>
              <Input
                className="min-h-11"
                id="preview-email"
                type="email"
                placeholder="staff@example.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-password">Password</Label>
              <Input
                className="min-h-11"
                id="preview-password"
                type="password"
                autoComplete="off"
              />
            </div>
            <Button disabled className="min-h-11 w-full">
              Sign in (preview only)
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Clerk keys are required for actual sign-in.
            </p>
          </div>
        ) : (
          <SignIn
            routing="hash"
            forceRedirectUrl="/admin"
            signUpUrl="/admin/sign-up"
            appearance={{
              elements: {
                rootBox: { width: "100%", maxWidth: "100%" },
                cardBox: {
                  width: "100%",
                  maxWidth: "100%",
                  border: "none",
                  boxShadow: "none",
                  background: "transparent",
                },
                card: {
                  width: "100%",
                  maxWidth: "100%",
                  border: "none",
                  boxShadow: "none",
                  background: "transparent",
                  padding: 0,
                },
                // Keep password, recovery, and verification instructions visible.
                header: {
                  '&:has([data-localization-key="signIn.start.title"])': {
                    display: "none",
                  },
                },
                footerAction: { display: "none" },
              },
              variables: {
                colorPrimary: "#0D6EFD",
                fontFamily: "var(--font-poppins)",
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
