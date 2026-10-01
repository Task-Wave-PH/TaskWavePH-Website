import { SignIn } from "@clerk/nextjs";
export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <SignIn
        routing="hash"
        forceRedirectUrl="/admin"
        appearance={{
          elements: { footerAction: "hidden" },
          variables: {
            colorPrimary: "#0D6EFD",
            fontFamily: "var(--font-poppins)",
          },
        }}
      />
    </main>
  );
}
