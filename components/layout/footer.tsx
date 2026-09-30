import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>TaskWavePH · Recruitment & staffing in the Philippines</p>
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground"
        >
          Privacy notice
        </Link>
      </div>
    </footer>
  );
}
