import { useEffect, useState } from "react";

/**
 * 0'dan hedefe yumuşakça sayan animasyonlu sayaç (istatistik kartları için).
 * `prefers-reduced-motion` tercihinde animasyonsuz, doğrudan hedefi döner.
 */
export function useCountUp(target: number, durationMs = 1000): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      setValue(target);
      return;
    }

    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
