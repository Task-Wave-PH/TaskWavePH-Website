"use client";

import { useEffect, type ReactNode } from "react";
import { useAnimate } from "motion/react-mini";

/** Content stays visible without JavaScript, observer support, or animation support. */
export function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, animate] = useAnimate<HTMLDivElement>();
  useEffect(() => {
    const node = ref.current;
    if (
      !node ||
      typeof IntersectionObserver === "undefined" ||
      typeof node.animate !== "function"
    )
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: ReturnType<typeof animate> | undefined;
    const clearStyles = () => {
      node.style.removeProperty("opacity");
      node.style.removeProperty("transform");
    };
    const cancel = () => {
      animation?.cancel();
      clearStyles();
    };
    let observer: IntersectionObserver | undefined;
    // Avoid replaying an entrance over content already painted on first load.
    const bounds = node.getBoundingClientRect();
    let entered = bounds.bottom > 0 && bounds.top < window.innerHeight;
    const stop = () => {
      cancel();
      observer?.disconnect();
    };
    const observe = () => {
      stop();
      if (preference.matches || entered) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          entered = true;
          observer?.disconnect();
          // Anchors and keyboard focus must never be visually delayed.
          if (
            node.contains(document.activeElement) ||
            (location.hash && node.id === location.hash.slice(1)) ||
            node.closest(":target") ||
            node.querySelector(":target")
          )
            return;
          animation = animate(
            node,
            { opacity: [0.55, 1], transform: ["translateY(12px)", "none"] },
            {
              duration: 0.38,
              delay: Math.min(Math.max(delay, 0), 120) / 1000,
              ease: [0.22, 1, 0.36, 1],
              onComplete: clearStyles,
            },
          );
        },
        { threshold: 0.08 },
      );
      observer.observe(node);
    };
    const onFocus = cancel;
    node.addEventListener("focusin", onFocus);
    preference.addEventListener("change", observe);
    observe();
    return () => {
      stop();
      node.removeEventListener("focusin", onFocus);
      preference.removeEventListener("change", observe);
    };
  }, [delay, ref, animate]);
  return (
    <div ref={ref} className={className} data-motion-reveal>
      {children}
    </div>
  );
}
