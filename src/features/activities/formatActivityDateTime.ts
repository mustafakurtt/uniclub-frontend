/**
 * Etkinlik tarih/saat gösterimi.
 *
 * Şimdilik tarayıcı saat dilimi kullanılır. Tenant saat dilimi backend'e
 * eklendiğinde bu modül tek noktadan `university.timezone` (veya eşdeğeri)
 * ile güncellenecek — sayfalar bu fonksiyonları import etmeye devam eder.
 */

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

const LOCALE = "tr-TR";

/** Örn. "15 Ağustos 2026" */
export function formatActivityDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, DATE_OPTS);
}

/** Örn. "14:30" */
export function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, TIME_OPTS);
}

/** Örn. "15 Ağustos 2026, 14:30" */
export function formatActivityDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, { ...DATE_OPTS, ...TIME_OPTS });
}

/** Başlangıç–bitiş aralığı; bitiş yoksa yalnızca başlangıç. */
export function formatActivityRange(startsAt: string, endsAt: string | null): string {
  const startDate = formatActivityDate(startsAt);
  const startTime = formatActivityTime(startsAt);

  if (!endsAt) {
    return `${startDate}, ${startTime}`;
  }

  const endDate = formatActivityDate(endsAt);
  const endTime = formatActivityTime(endsAt);

  if (startDate === endDate) {
    return `${startDate}, ${startTime} – ${endTime}`;
  }

  return `${startDate}, ${startTime} – ${endDate}, ${endTime}`;
}
