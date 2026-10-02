import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  eager = false,
}: {
  className?: string;
  eager?: boolean;
}) {
  return (
    // The 5:1 frame hides only the original canvas padding, retaining the full mark and tagline.
    <span
      className={cn(
        "relative block aspect-[5/1] w-[140px] overflow-hidden sm:w-[210px]",
        className,
      )}
    >
      <Image
        src="/logo/taskwaveph-logo-transparent.png"
        alt="TaskWavePH"
        fill
        sizes="(max-width: 639px) 140px, 210px"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="object-cover object-center"
      />
    </span>
  );
}
