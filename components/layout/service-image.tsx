"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** Keep offscreen illustrations lazy, with a fallback for native lazy-load stalls. */
export function ServiceImage({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = ref.current;
    if (!image || (image.complete && image.naturalWidth > 0)) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        // Changing loading starts native source selection without replacing srcset.
        image.loading = "eager";
        observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(image);
    return () => observer.disconnect();
  }, []);
  return (
    <Image
      ref={ref}
      src={src}
      alt=""
      width={1254}
      height={1254}
      sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 64px), 558px"
      className="h-full w-full object-contain sm:h-auto"
    />
  );
}
