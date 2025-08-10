"use client";

import { useEffect, useRef, useState } from "react";
import { toFaDigits } from "@/lib/format";

/**
 * Animated number counter that counts up from 0 to `value` over `duration` ms
 * when it enters the viewport. Respects prefers-reduced-motion (renders final
 * value immediately). The displayed text is passed through `format` (defaults
 * to Persian digits).
 */
export function AnimatedCounter({
  value,
  duration = 1400,
  suffix = "",
  prefix = "",
  format = (n: number) => toFaDigits(Math.round(n).toLocaleString("en-US")),
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              // easeOutExpo
              const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
              setDisplay(value * eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}
