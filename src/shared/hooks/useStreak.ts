import { useState } from "react";

/**
 * Günlük ziyaret serisi ("streak") — arka uç gerektirmeyen, cihaza özel
 * bir bağlılık mekaniği. Kullanıcı üst üste her gün girdikçe sayı büyür;
 * bir gün atlarsa 1'e döner. Amaç ceza değil küçük bir gurur duygusu —
 * bu yüzden sıfır değil hep en az 1 gösterilir (bugün buradasın).
 *
 * localStorage bilinçli olarak burada, hook içinde okunur (bileşenlerde
 * yasak olan `token` erişimi bu değildir); private mod vb. için try/catch'li.
 */

const STORAGE_KEY = "uniclub.streak";

interface StreakRecord {
  /** Son ziyaret günü, YYYY-MM-DD (yerel saat) */
  last: string;
  count: number;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readAndAdvance(): { count: number; extendedToday: boolean } {
  try {
    const now = new Date();
    const today = dateKey(now);
    const raw = localStorage.getItem(STORAGE_KEY);
    const record = raw ? (JSON.parse(raw) as StreakRecord) : null;

    if (record?.last === today) {
      return { count: Math.max(1, record.count), extendedToday: false };
    }

    const yesterday = dateKey(new Date(now.getTime() - 86_400_000));
    const count = record?.last === yesterday ? record.count + 1 : 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ last: today, count } satisfies StreakRecord));
    return { count, extendedToday: true };
  } catch {
    return { count: 1, extendedToday: false };
  }
}

export function useStreak(): { count: number; extendedToday: boolean } {
  // Sadece ilk render'da hesaplanır; gün içinde tekrar yazmaz.
  const [streak] = useState(readAndAdvance);
  return streak;
}
