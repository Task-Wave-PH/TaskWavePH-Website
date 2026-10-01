import { LoginForm } from "@/components/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-secondary/50 p-5 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="self-center">
          <BrandLogo eager />
        </div>
        <LoginForm />
        <p className="px-6 text-center text-sm text-muted-foreground">
          Access is restricted to approved TaskWavePH staff.
        </p>
      </div>
    </main>
  );
}
