import { useCallback, useEffect, useState } from "react";

/**
 * Geri sayımlı buton kilidi — 429 (`RATE_LIMITED`) yanıtları için
 * (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §3).
 *
 * Bitiş anını (timestamp) tutar, kalan saniyeyi ondan türetir; sayaç değil.
 * Sekme arka plandayken tarayıcı `setInterval`'i kıstığı için sayaç tutan bir
 * uygulama geri gelindiğinde yanlış değeri gösterirdi.
 *
 * DİKKAT: bu yalnızca UX'tir. Gerçek sınır backend'de — sayfa yenilenince
 * buradaki kilit sıfırlanır ama istek yine 429 döner.
 */
export function useCooldown() {
  const [until, setUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (until === null) return;

    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) setUntil(null);
    };

    tick(); // ilk değeri beklemeden bas
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  const start = useCallback((seconds: number) => {
    setUntil(Date.now() + seconds * 1000);
  }, []);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}

/** "45 sn" / "12:05" — geri sayım etiketi. */
export function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
