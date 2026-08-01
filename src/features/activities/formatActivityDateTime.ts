/**
 * Etkinlik tarih/saat gösterimi.
 *
 * Tenant `timezone` varsa kurum duvar saatine çevirir (kampüs etkinlikleri için
 * doğru okuma). Yoksa tarayıcı saat dilimine düşer. Her zaman kısa TZ etiketi
 * eklenir — kullanıcı hangi saati okuduğunu bilir.
 */
import { formatTimezoneShortLabel } from "@/shared/lib/tenantLocalDatetime";

const LOCALE = "tr-TR";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

function tzOpts(timezone?: string | null): Intl.DateTimeFormatOptions {
  return timezone ? { timeZone: timezone } : {};
}

function suffix(timezone?: string | null): string {
  if (timezone) return formatTimezoneShortLabel(timezone, LOCALE);
  return "tarayıcı saati";
}

/** Örn. "15 Ağustos 2026" */
export function formatActivityDate(iso: string, timezone?: string | null): string {
  return new Date(iso).toLocaleDateString(LOCALE, { ...DATE_OPTS, ...tzOpts(timezone) });
}

/** Örn. "14:30" */
export function formatActivityTime(iso: string, timezone?: string | null): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { ...TIME_OPTS, ...tzOpts(timezone) });
}

/** Örn. "15 Ağustos 2026, 14:30 (GMT+3)" */
export function formatActivityDateTime(iso: string, timezone?: string | null): string {
  const base = new Date(iso).toLocaleString(LOCALE, { ...DATE_OPTS, ...TIME_OPTS, ...tzOpts(timezone) });
  return `${base} (${suffix(timezone)})`;
}

/** Başlangıç–bitiş aralığı; bitiş yoksa yalnızca başlangıç. */
export function formatActivityRange(
  startsAt: string,
  endsAt: string | null,
  timezone?: string | null
): string {
  const startDate = formatActivityDate(startsAt, timezone);
  const startTime = formatActivityTime(startsAt, timezone);
  const tz = suffix(timezone);

  if (!endsAt) {
    return `${startDate}, ${startTime} (${tz})`;
  }

  const endDate = formatActivityDate(endsAt, timezone);
  const endTime = formatActivityTime(endsAt, timezone);

  if (startDate === endDate) {
    return `${startDate}, ${startTime} – ${endTime} (${tz})`;
  }

  return `${startDate}, ${startTime} – ${endDate}, ${endTime} (${tz})`;
}

/** Zamanlanmış yayın — tenant yerel duvar saati metni (UTC yanıttan türetilir). */
export function formatScheduledPublishAt(
  isoUtc: string,
  timezone: string
): string {
  const base = new Date(isoUtc).toLocaleString(LOCALE, {
    ...DATE_OPTS,
    ...TIME_OPTS,
    timeZone: timezone,
  });
  return `${base} (${formatTimezoneShortLabel(timezone, LOCALE)})`;
}

/** datetime-local ön doldurma — etkinlik başlangıcı için (tarayıcı TZ). */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
